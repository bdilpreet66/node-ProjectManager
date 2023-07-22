import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, Image, TouchableOpacity, StyleSheet, Dimensions, Modal, Alert  } from 'react-native';
import { useNavigation, useFocusEffect  } from '@react-navigation/native';
import { getTasksByMember, listIncompletePrerequisite } from '../../../store/project'; // Assuming you have the user functions in a file named 'user.js'
import commonStyles from '../../../theme/commonStyles';
import { formatDate } from '../../../common/Date'
import { statusBadge } from '../../../common/Status';
import theme from '../../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const ProjectListScreen = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const screenWidth = Dimensions.get('window').width - 40;
  
  useFocusEffect(
    useCallback(() => {
      handleSearch();
      // return a cleanup function if necessary
      return () => {};
    }, [])
  );
  
  const loadTasks = async (cur_page = page) => {
    if (loading || !hasMore) return;
    setLoading(true);
  
    try {
      const newTasks = await getTasksByMember(cur_page, searchText); // Fetch tasks from the first page
      console.log(newTasks)
      setTasks((prevTasks) => [...prevTasks, ...newTasks]);
      setPage(cur_page + 1);
      setHasMore(newTasks.length > 0);
    } catch (error) {
      setHasMore(false);
    }
  
    setLoading(false);
  };

  const handleSearch = async () => {
    // Reset pagination and load tasks based on the search text
    setPage(1);
    setTasks([]);
    setHasMore(true);
    loadTasks(1);
  };

  const handleTaskView = async (task) => { 
    const prerequisitesData = await listIncompletePrerequisite(task.id);
    if (prerequisitesData.length > 0) {
      Alert.alert('Message', 'This task is not allowed to view as it has an incomplete pre-requisite.');
    }
    else {
      navigation.navigate('View Task', {task})
     }
  }

  const renderItem = ({ item }) => (   
    <TouchableOpacity style={[styles.listItem]} onPress={() => handleTaskView(item)}>
      <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
      }}>
        <Text>{ item.id}#. {item.name}</Text>
        <Text>Due - { formatDate(item.end_date) }</Text>
      </View>
      <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
      }}>
        <View>{statusBadge(item.status, item.end_date)}</View>
        <Text style={{color:theme.colors.grey}}>{item.project_name}</Text>
      </View>
    </TouchableOpacity>    
  );

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} />;
  };

  return (
    <View style={[commonStyles.container,styles.container]}>
      <Image source={require('../../../../assets/Logo.png')} style={commonStyles.logoLabel} resizeMode='contain'/>
      <Text style={[commonStyles.heading, { textAlign: 'left' }]}>My Tasks</Text>
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
        data={tasks}
        style={{width:"100%"}}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()} // Assuming each member has a unique ID
        onEndReached={loadTasks} // Load more tasks when reaching the end of the list
        onEndReachedThreshold={0.1} // Trigger the onEndReached callback when 10% of the list is reached
        ListFooterComponent={renderFooter} // Show loading indicator at the bottom while loading more tasks
      />
    </View>
  );
};

const styles = StyleSheet.create({  
  container: {       
    padding: 20,
    alignItems: 'flex-start',
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
    width: "100%",
    padding: 10, 
    borderRadius: 5, 
    marginTop: 10, 
  },
});

export default ProjectListScreen;