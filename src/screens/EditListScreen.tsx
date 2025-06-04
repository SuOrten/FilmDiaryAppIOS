import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Image, Alert } from 'react-native';
import { Text, Surface, IconButton, Portal, Dialog, TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const BACKEND_URL = 'http://192.168.31.123:5001';
const userID = 12; // This will be replaced with actual user ID from login

type EditListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditList'>;
type EditListScreenRouteProp = RouteProp<RootStackParamList, 'EditList'>;

const EditListScreen = () => {
  const [list, setList] = useState<any>(null);
  const [reviewDialogVisible, setReviewDialogVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<EditListScreenNavigationProp>();
  const route = useRoute<EditListScreenRouteProp>();
  const { listID, listName } = route.params;

  useEffect(() => {
    fetchListContents();
  }, []);

  const fetchListContents = async () => {
    try {
      console.log('Fetching list contents for listID:', listID);
      const response = await fetch(`${BACKEND_URL}/api/lists/${userID}`);
      const data = await response.json();
      console.log('Fetched data:', data);
      
      if (data.success) {
        const listData = data.lists.find((l: any) => l.ListID === listID);
        console.log('Found list data:', listData);
        
        if (listData) {
          setList(listData);
        } else {
          console.log('List not found in response');
          Alert.alert('Error', 'List not found');
        }
      } else {
        console.log('API call not successful');
        Alert.alert('Error', 'Failed to load list contents');
      }
    } catch (err) {
      console.error('Error fetching list:', err);
      Alert.alert('Error', 'Failed to load list contents');
    }
  };

  const handleDeleteMovie = async (movieID: number, movieTitle: string) => {
    Alert.alert(
      'Remove Movie',
      `Are you sure you want to remove "${movieTitle}" from this list?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/lists/${listID}/movies/${movieID}`, {
                method: 'DELETE',
              });
              const data = await response.json();
              if (data.success) {
                setList({
                  ...list,
                  movies: list.movies.filter((m: any) => m.MovieID !== movieID),
                });
              } else {
                Alert.alert('Error', data.message || 'Failed to remove movie');
              }
            } catch (err) {
              console.error('Error removing movie:', err);
              Alert.alert('Error', 'Failed to remove movie');
            }
          },
        },
      ],
    );
  };

  const handleReviewPress = (movie: any) => {
    setSelectedMovie(movie);
    setReviewText(movie.Review || '');
    setReviewDialogVisible(true);
  };

  const handleSaveReview = async () => {
    if (!selectedMovie) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/lists/${listID}/movies/${selectedMovie.MovieID}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review: reviewText }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server response:', errorData);
        throw new Error('Failed to save review');
      }
      
      const data = await response.json();
      if (data.success) {
        setList({
          ...list,
          movies: list.movies.map((m: any) => 
            m.MovieID === selectedMovie.MovieID 
              ? { ...m, Review: reviewText }
              : m
          ),
        });
        setReviewDialogVisible(false);
      } else {
        Alert.alert('Error', data.message || 'Failed to save review');
      }
    } catch (err) {
      console.error('Error saving review:', err);
      Alert.alert('Error', 'Failed to save review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.surface}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Edit List: {listName}</Text>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>

        <FlatList
          data={list?.movies || []}
          keyExtractor={item => item.MovieID.toString()}
          renderItem={({ item }) => (
            <View style={styles.movieContainer}>
              <Image 
                source={{ uri: item.PosterURL }} 
                style={styles.moviePoster} 
              />
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle}>{item.Title}</Text>
                {item.ReleaseYear && (
                  <Text style={styles.movieYear}>{item.ReleaseYear}</Text>
                )}
                {item.Review && (
                  <Text style={styles.reviewText} numberOfLines={2}>
                    Review: {item.Review}
                  </Text>
                )}
              </View>
              <View style={styles.buttonContainer}>
                <IconButton
                  icon="pencil"
                  size={24}
                  iconColor="#1a237e"
                  onPress={() => handleReviewPress(item)}
                  style={styles.reviewButton}
                />
                <IconButton
                  icon="delete"
                  size={24}
                  iconColor="#d32f2f"
                  onPress={() => handleDeleteMovie(item.MovieID, item.Title)}
                  style={styles.deleteButton}
                />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No movies in this list</Text>
          }
        />

        <Portal>
          <Dialog visible={reviewDialogVisible} onDismiss={() => setReviewDialogVisible(false)}>
            <Dialog.Title>Write a Review</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.dialogMovieTitle}>{selectedMovie?.Title}</Text>
              <TextInput
                label="Your Review"
                value={reviewText}
                onChangeText={setReviewText}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.reviewInput}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setReviewDialogVisible(false)}>Cancel</Button>
              <Button onPress={handleSaveReview} loading={loading} disabled={loading}>
                Save
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </Surface>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  surface: {
    flex: 1,
    padding: 20,
    margin: 16,
    borderRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a237e',
    flex: 1,
  },
  backButton: {
    margin: 0,
  },
  movieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  moviePoster: {
    width: 60,
    height: 90,
    borderRadius: 6,
  },
  movieInfo: {
    flex: 1,
    marginLeft: 12,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  movieYear: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  reviewText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewButton: {
    margin: 0,
  },
  deleteButton: {
    margin: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  dialogMovieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a237e',
  },
  reviewInput: {
    marginTop: 8,
  },
});

export default EditListScreen; 