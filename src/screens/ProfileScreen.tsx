import React, { useState } from 'react';
import { StyleSheet, View, Alert, ScrollView, Image, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
  'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
];

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const ProfileScreen = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  // Kullanıcı verilerini yükle
  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          setUsername(user.username || '');
          setEmail(user.email || '');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  const handleGenreToggle = (genre: string) => {
    setFavoriteGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access media library is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    if (!username || !email) {
      Alert.alert('Error', 'Please fill in your username and email');
      return;
    }
    setLoading(true);
    try {
      // Token'ı AsyncStorage'dan al
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          username,
          email,
          bio,
          favoriteGenres: favoriteGenres.join(','),
          profilePhoto,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }
      Alert.alert('Success', data.message || 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('MyLists'),
        },
      ]);
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      Alert.alert('Success', 'Logged out successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Surface style={styles.surface}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>Profile</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>Tell us about yourself</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={loading}
            />
            <TextInput
              label="Bio / About Me"
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              disabled={loading}
            />
            <Text style={styles.genreLabel}>Favorite Genres</Text>
            <View style={styles.genreContainer}>
              {GENRES.map(genre => (
                <Chip
                  key={genre}
                  selected={favoriteGenres.includes(genre)}
                  onPress={() => handleGenreToggle(genre)}
                  style={styles.genreChip}
                  mode="outlined"
                >
                  {genre}
                </Chip>
              ))}
            </View>
            <Text style={styles.genreLabel}>Profile Photo</Text>
            <TouchableOpacity onPress={pickImage} style={styles.profileImagePicker} disabled={loading}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' }]}> 
                  <MaterialIcons name="add-a-photo" size={36} color="#888" />
                </View>
              )}
            </TouchableOpacity>
            <Button
              mode="contained"
              onPress={handleUpdateProfile}
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              Update Profile
            </Button>

            <Button
              mode="outlined"
              onPress={handleLogout}
              style={[styles.button, { marginTop: 20 }]}
              disabled={loading}
            >
              Logout
            </Button>
          </View>
        </Surface>
      </ScrollView>
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
    marginVertical: 20,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a237e',
  },
  subtitle: {
    color: '#666',
    marginTop: 8,
  },
  form: {
    marginTop: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  genreLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  genreChip: {
    margin: 4,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 16,
  },
  profileImagePicker: {
    alignSelf: 'center',
    marginBottom: 16,
  },
});

export default ProfileScreen; 