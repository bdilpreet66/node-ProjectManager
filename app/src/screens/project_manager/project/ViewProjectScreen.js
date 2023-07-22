import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, FlatList, Dimensions, ScrollView } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import commonStyles from '../../../theme/commonStyles';
import { updateProjectByID, getTasksByProject, getProjectTotalCost, getProjectDetails } from './../../../store/project';
import theme from '../../../theme/theme';
import { formatDate } from '../../../common/Date';
import { Ionicons } from '@expo/vector-icons';
import {statusBadge} from '../../../common/Status';

const ViewProjectScreen = () => {
  const route = useRoute();
  const { project } = route.params;
  console.log(project)
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [totalCost, serTotalCost] = useState('0.00');

  const [projectData, setProjectData] = useState({
    id: project.id,
    name: project.name,
    description: project.description,
    total_cost: project.total_cost,
    status: project.status,
    completion_date: project.completion_date,
    created_by: project.created_by,
  });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const taskData = await getTasksByProject(project.id);
        setTasks(taskData);

        const totalCost = await getProjectTotalCost(project.id);    
        serTotalCost(totalCost);
      })();

    }, [])
  );

  const handleSave = async () => {
    try {
        await updateProjectByID(projectData.id, projectData);
        Alert.alert('Success', 'Project details saved successfully.');
    } catch (error) {
        console.error('Error saving project data:', error);
        Alert.alert('Error', 'Failed to save project details.');
    }
  };

  return (
    <View style={styles.scroll}>      
      <View style={styles.ctaContainer}> 
        <TouchableOpacity onPress={() => navigation.navigate('Project List')}>          
          <Ionicons name="close-outline" style={{color:'#D85151'}} size={36} />
        </TouchableOpacity>      
        <Text style={[commonStyles.labelTopNavHeading,commonStyles.bold]}>Project Details</Text>
        <TouchableOpacity onPress={handleSave}>          
          <Ionicons name="checkmark-outline" style={{color:'#34A654'}} size={36} />
        </TouchableOpacity>      
      </View> 
      <ScrollView> 
        <View style={[commonStyles.container, styles.container]}>      
          <View style={styles.inputContainer}>
            <Text style={commonStyles.inputLabel}>Name</Text>
            <TextInput
                value={projectData.name}                
                style={commonStyles.input}
                onChangeText={(text) => setProjectData({ ...projectData, name: text })}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={commonStyles.inputLabel}>Description</Text>
            <TextInput
                value={projectData.description}            
                multiline
                numberOfLines={4}
                style={[commonStyles.input,{ height: 140 }]}
                onChangeText={(text) => setProjectData({ ...projectData, description: text })}
            />                                    
          </View>
          <View style={[styles.inputContainer]}>
            <Text style={commonStyles.inputLabel}>Status</Text>
          </View>
          <View style={[styles.staticContent]}>
            {projectData.status === 'pending' ?
              <Text style={[commonStyles.inputLabel,commonStyles.badge,commonStyles.badgeWarning,styles.status]}>Incomplete</Text>
            :
              <Text style={[commonStyles.inputLabel,]}>Completed</Text>
            }        
          </View>            
          <View style={styles.inputContainer}>
            <Text style={commonStyles.inputLabel}>Total Cost</Text>        
          </View>            
          <View style={[styles.staticContent]}>
            <Text style={[commonStyles.inputLabel]}>$ {totalCost}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Work History',{ projectId: projectData.id } )}>
              <Text style={[commonStyles.link,commonStyles.underline]}>View Logs</Text>
            </TouchableOpacity>            
          </View>
        </View>   
        
        <View style={styles.taskHeaderContainer}>
          <Text style={[commonStyles.bold]}>Task List</Text>
          <TouchableOpacity style={[]} onPress={() => navigation.navigate('Create Task',{ project: projectData } )}>
            <Text style={[styles.createTaskButton]}>Create Task <Ionicons name="add-circle-outline" size={16}/></Text>
          </TouchableOpacity>  
        </View>

        <View style={styles.taskList}>
          {tasks.map(
            (item,key) => (    
              <TouchableOpacity key={key} style={[styles.listItem]} onPress={() => navigation.navigate('View Task', { project: project, task: item })}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{width:'60%'}}><Text>{item.id}# {item.name}</Text></View>
                  <View><Text>Due: {formatDate(item.end_date)}</Text></View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {statusBadge(item.status, item.end_date)}
                    <Text>{item.assigned_to}</Text>
                </View>
              </TouchableOpacity>
            )
          )}
        </View>    
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({  
  container: {    
    alignItems: 'flex-start',    
    padding: 20
  },  
  button: {
    width: 'auto',
    paddingVertical: 10,    
    marginBottom: 0,

  }, 
  inputContainer: {
    marginTop: 20,
  },
  taskHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',    
    backgroundColor: theme.colors.white,
    paddingHorizontal: 20,
    marginTop: 30,
  },
  ctaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',    
    paddingTop: 60,    
    backgroundColor: theme.colors.white,
    paddingHorizontal: 15,   
  },
  ctaButton: {    
    width: 'auto',    
    borderWidth: 2,
    borderColor: theme.colors.primary,
    position: 'absolute',
    right: 20,
    bottom: 0,
  },
  ctaButtonText: {
    color: theme.colors.black,    
  },
  staticContent: {
    backgroundColor: theme.colors.greyBackground,
    padding: 10,
    borderRadius: 5,
    width: '100%',
    display: 'flex',
  },
  status:{
    width: 130,
    textAlign: 'center',
  },
  listItem: {
    marginBottom: 20,
    backgroundColor: theme.colors.greyBackground,
    borderRadius: 5,
    padding: 10,
  },
  scroll: {
    backgroundColor: theme.colors.white,
    height: "100%",
    marginBottom: 90
  },
  taskList: {
    marginTop: 0,
    padding: 20,
  },
  createTaskButton: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
});

export default ViewProjectScreen;
