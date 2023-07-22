import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { listProjects } from '../../../store/project'; // Assuming you have the user functions in a file named 'user.js'
import commonStyles from '../../../theme/commonStyles';
import theme from '../../../theme/theme';
import { Ionicons } from '@expo/vector-icons';


const ProjectListScreen = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const screenWidth = Dimensions.get('window').width - 40;

  useFocusEffect(
    useCallback(() => {
      handleSearch();
    }, [])
  );
  
  const loadProjects = async (cur_page = page) => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const newProjects = await listProjects(cur_page, searchText); // Fetch projects from the first page
  
      setProjects((prevProjects) => [...prevProjects, ...newProjects]);
      setHasMore(newProjects.length > 0);
      setPage(cur_page + 1);
    } catch (error) {
      console.error('Error loading projects:', error);
    }

    setLoading(false);
  };

  const handleSearch = async () => {
    // Reset pagination and load projects based on the search text
    setPage(1);
    setProjects([]);
    setHasMore(true);
    loadProjects(1);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[{ width: screenWidth }, styles.listItem]} onPress={() => navigation.navigate('View Project', { project: item })}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Text>{item.id}# {item.name}</Text>
        {item.status == "completed" ?
          <Text>Completed: {item.completion_date}</Text> :
          <Text>Incomplete</Text>
        }
      </View>
      <View>
        {item.status == "pending" ?
          <Text style={[commonStyles.badge, commonStyles.badgeWarning, styles.badge]}>{item.status}</Text> :
          <Text style={[commonStyles.badge, commonStyles.badgeDefault, styles.badge]}>{item.status}</Text>
        }
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;

    return <ActivityIndicator style={{ marginVertical: 20 }} />;
  };

  return (
    <View style={[commonStyles.container, styles.container]}>
      <Image source={require('../../../../assets/Logo.png')} style={commonStyles.logoLabel} resizeMode='contain' />
      <Text style={commonStyles.heading}>Project Management</Text>
      <Text>Create and modify your projects.</Text>      
      <TouchableOpacity style={[commonStyles.button, commonStyles.buttonPrimary, styles.button]} onPress={() => navigation.navigate('Create Project')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "center" }}>
          <Text style={[commonStyles.buttonText, commonStyles.buttonTextPrimary]}>
            Create Project
          </Text>
          <Ionicons name="add-circle-outline" style={{marginLeft:10,color:theme.colors.white}} size={24} />
        </View>
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          autoCapitalize='none'
          onChangeText={setSearchText}
          value={searchText}
        />
        <TouchableOpacity style={styles.iconContainer} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={projects}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()} // Assuming each member has a unique ID
        onEndReached={() => {loadProjects()}} // Load more projects when reaching the end of the list
        onEndReachedThreshold={0.1} // Trigger the onEndReached callback when 10% of the list is reached
        ListFooterComponent={renderFooter} // Show loading indicator at the bottom while loading more projects
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    padding: 20,
  },
  button: {
    marginTop: 20,
    marginBottom: 20,
  },
  searchContainer: {
    backgroundColor: theme.colors.greyBackground,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.grey,
    borderRadius: 5,
    width: '100%',
    alignSelf: 'center',
  },
  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: "88%"
  },
  iconContainer: {
    borderLeftWidth: 1,
    borderColor: theme.colors.grey,
    padding: 10,
  },
  icon: {
    width: 20,
    height: 15,
    alignSelf: 'center',
  },
  listItem: {
    backgroundColor: '#F8F8F8',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  badge: {
    width: 100,
    textAlign: 'center',
    marginTop: 5,
  },
  
});

export default ProjectListScreen;
