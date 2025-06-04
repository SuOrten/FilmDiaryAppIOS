import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, Surface, Button, TextInput, Portal, Dialog, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const BACKEND_URL = 'http://192.168.31.123:5001';
const userID = 12; // This will be replaced with actual user ID from login

type MyListsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MyLists'>;

const MyListsScreen = () => {
  const [userLists, setUserLists] = useState<any[]>([]);
  const [newListName, setNewListName] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedListID, setSelectedListID] = useState<number | null>(null);
  const navigation = useNavigation<MyListsScreenNavigationProp>();

  useEffect(() => {
    fetchUserLists();
  }, []);

  const fetchUserLists = async () => {
    try {
      console.log('Fetching lists for user:', userID);
      const response = await fetch(`${BACKEND_URL}/api/lists/${userID}`);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Fetched lists data:', JSON.stringify(data, null, 2));
      if (data.success) {
        console.log('Setting user lists:', data.lists);
        setUserLists(data.lists);
      } else {
        console.error('Failed to fetch lists:', data.message);
      }
    } catch (err) {
      console.error('Error fetching lists:', err);
      setUserLists([]);
    }
  };

  const createList = async () => {
    if (!newListName) return;
    try {
      console.log('Creating new list:', { userID, listName: newListName });
      const response = await fetch(`${BACKEND_URL}/api/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID, listName: newListName }),
      });
      console.log('Create list response status:', response.status);
      const data = await response.json();
      console.log('Create list response:', data);
      if (data.success) {
        console.log('List created successfully, fetching updated lists...');
        await fetchUserLists();
        setNewListName('');
        setDialogVisible(false);
      } else {
        console.error('Error creating list:', data.message);
        alert('Error creating list');
      }
    } catch (err) {
      console.error('Error creating list:', err);
      alert('Error creating list');
    }
  };

  const handleListPress = (listID: number) => {
    setSelectedListID(listID);
    navigation.navigate('MovieSelection', { selectedListID: listID });
  };

  const handleEditList = (listID: number, listName: string) => {
    navigation.navigate('EditList', { listID, listName });
  };

  const handleDeleteList = async (listID: number, listName: string) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${listName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Sending delete request for list:', listID);
              const response = await fetch(`${BACKEND_URL}/api/lists/${listID}`, {
                method: 'DELETE',
              });
              const data = await response.json();
              console.log('Delete response:', data);
              
              if (data.success) {
                setUserLists(userLists.filter(list => list.ListID !== listID));
                if (selectedListID === listID) {
                  setSelectedListID(null);
                }
              } else {
                Alert.alert(
                  'Error',
                  data.message || 'Error deleting list. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert(
                'Error',
                'Failed to delete list. Please check your connection and try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.surface}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>My Movie Lists</Text>
          <Button 
            mode="contained" 
            onPress={() => setDialogVisible(true)}
            style={styles.createButton}
          >
            Create List
          </Button>
        </View>

        <FlatList
          data={userLists}
          keyExtractor={item => item.ListID.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.listContainer,
                selectedListID === item.ListID && styles.selectedList
              ]}
              onPress={() => handleListPress(item.ListID)}
            >
              <View style={styles.listHeader}>
                <View style={styles.listTitleContainer}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    iconColor="#ffc107"
                    onPress={() => handleEditList(item.ListID, item.ListName)}
                    style={styles.editButton}
                  />
                  <Text style={styles.listName}>{item.ListName}</Text>
                </View>
                <IconButton
                  icon="close"
                  size={20}
                  iconColor="#d32f2f"
                  onPress={() => handleDeleteList(item.ListID, item.ListName)}
                  style={styles.deleteButton}
                />
              </View>
              <FlatList
                data={item.movies}
                keyExtractor={movie => movie.MovieID.toString()}
                horizontal
                renderItem={({ item: movie }) => (
                  <View style={styles.movieContainer}>
                    <Image 
                      source={{ uri: movie.PosterURL }} 
                      style={styles.moviePoster} 
                    />
                    <Text numberOfLines={1} style={styles.movieTitle}>
                      {movie.Title}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No movies in this list</Text>
                }
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No lists yet</Text>
          }
        />

        <Portal>
          <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
            <Dialog.Title>Create New List</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="List Name"
                value={newListName}
                onChangeText={setNewListName}
                mode="outlined"
                style={styles.input}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
              <Button onPress={createList}>Create</Button>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
  },
  createButton: {
    width: '100%',
  },
  listContainer: {
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedList: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1a237e',
    borderWidth: 1,
  },
  listName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1a237e',
    flex: 1,
  },
  editButton: {
    margin: 0,
    padding: 0,
  },
  deleteButton: {
    margin: 0,
    padding: 0,
  },
  movieContainer: {
    marginRight: 12,
    alignItems: 'center',
    width: 100,
  },
  moviePoster: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
  },
  movieTitle: {
    textAlign: 'center',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  input: {
    marginBottom: 8,
  },
});

export default MyListsScreen; 