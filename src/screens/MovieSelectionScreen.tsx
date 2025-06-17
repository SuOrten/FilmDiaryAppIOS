import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Image } from 'react-native';
import { TextInput, Button, Text, Surface, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const TMDB_SEARCH_URL = 'https://api.themoviedb.org/3/search/movie';
const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w185';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type MovieSelectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MovieSelection'>;
type MovieSelectionScreenRouteProp = RouteProp<RootStackParamList, 'MovieSelection'>;

const MovieSelectionScreen = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<MovieSelectionScreenNavigationProp>();
  const route = useRoute<MovieSelectionScreenRouteProp>();
  const selectedListID = route.params?.selectedListID;

  const searchMovies = async () => {
    if (!query) return;
    setLoading(true);
    try {
      console.log('Searching for:', query);
      const response = await fetch(
        `${TMDB_SEARCH_URL}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      console.log('Search results:', data.results?.length || 0, 'movies found');
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addMovieToList = async (movie: any) => {
    if (!selectedListID) {
      alert('Please select a list first. Go to My Lists to create and select a list.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        alert('Authentication required. Please login again.');
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/lists/${selectedListID}/movies`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tmdbID: movie.id,
          title: movie.title,
          posterURL: movie.poster_path ? `${TMDB_IMAGE_URL}${movie.poster_path}` : '',
          releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
          overview: movie.overview,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Movie added to list!');
      } else {
        alert('Error adding movie to list');
      }
    } catch (err) {
      alert('Error adding movie to list');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.surface}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Movie Search</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('MyLists')}
            style={styles.listsButton}
          >
            My Lists
          </Button>
        </View>

        {!selectedListID && (
          <Text style={styles.warningText}>
            Please select a list from My Lists to add movies
          </Text>
        )}

        <TextInput
          label="Search for a movie"
          value={query}
          onChangeText={setQuery}
          mode="outlined"
          style={styles.input}
          onSubmitEditing={searchMovies}
          returnKeyType="search"
          disabled={loading}
        />
        <Button mode="contained" onPress={searchMovies} loading={loading} style={styles.button}>
          Search
        </Button>

        <FlatList
          data={searchResults}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardContent}>
                {item.poster_path ? (
                  <Image
                    source={{ uri: `${TMDB_IMAGE_URL}${item.poster_path}` }}
                    style={styles.poster}
                  />
                ) : (
                  <View style={[styles.poster, { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}> 
                    <Text>No Image</Text>
                  </View>
                )}
                <View style={styles.movieInfo}>
                  <Text variant="titleMedium">{item.title}</Text>
                  <Button
                    mode="outlined"
                    onPress={() => addMovieToList(item)}
                    style={styles.addButton}
                    disabled={!selectedListID}
                  >
                    Add to List
                  </Button>
                </View>
              </View>
            </Card>
          )}
          style={styles.resultsList}
          ListEmptyComponent={!loading && query ? <Text style={styles.emptyText}>No results found.</Text> : null}
        />
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
  },
  listsButton: {
    marginLeft: 16,
  },
  warningText: {
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
    padding: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poster: {
    width: 70,
    height: 105,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  movieInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  resultsList: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});

export default MovieSelectionScreen;
