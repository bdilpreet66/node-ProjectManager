import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import commonStyles from '../../../../theme/commonStyles';
import theme from '../../../../theme/theme';
import { Picker } from '@react-native-picker/picker';
import { getUserData } from '../../../../store/creds';
import { updateTaskStatus, addTaskComment, getTaskComments, calculateWorkedHour } from '../../../../store/project';
import { Ionicons } from '@expo/vector-icons';
import { statusBadge } from '../../../../common/Status';

const ViewTaskScreen = () => {
  const route = useRoute();
  const { task } = route.params;
  const navigation = useNavigation();
  console.log(task)
  
  const [id, _] = useState(task.id);
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description);
  const [startDate, setStartDate] = useState(new Date(task.start_date));
  const [endDate, setEndDate] = useState(new Date(task.end_date));
  const [assignedTo, setAssignedTo] = useState(task.assigned_to);
  const [status, setStatus] = useState(task.status);
  const [totalCost, serTotalCost] = useState('0.00');

  const [comment, setComment] = useState();
  const [comments, setComments] = useState([]);
 
  useFocusEffect(
    useCallback(() => {
      const fetchTotalCost = async () => {
        user = getUserData()
        const results = await calculateWorkedHour(task.id, user.email);
        serTotalCost(results);
      };

      const fetchComments = async () => {
        const results = await getTaskComments(task.id);
        setComments(results);
      };

      fetchComments();
      fetchTotalCost();
    }, [task])
  );

  const handleUpdateTask = async () => {
    try {
      // Create the task in the database
      await updateTaskStatus(id,status,task.project_id);
      Alert.alert("Success","Task has been updated!");
    } catch (error) {
      // Handle or display error if something goes wrong
      console.error(error);
      Alert.alert('Error','There was an error while creating the task.');
    }
  }

  const handleAddComment = async () => {
    await addTaskComment(comment, id);
    const results = await getTaskComments(task.id);
    setComments(results);
    setComment('');
  }

  return (
    <View style={styles.scroll}>      
      <View style={styles.ctaContainer}> 
        <TouchableOpacity onPress={() => navigation.goBack()}>          
          <Ionicons name="close-outline" style={{color:'#D85151'}} size={36} />
        </TouchableOpacity>      
        <Text style={[commonStyles.labelTopNavHeading,commonStyles.bold]}>Task Details</Text>
        <TouchableOpacity onPress={handleUpdateTask}>          
          <Ionicons name="checkmark-outline" style={{color:'#34A654'}} size={36} />
        </TouchableOpacity>      
      </View> 
      <ScrollView> 
        <View style={[commonStyles.container,styles.container]}>
            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Name</Text>
              <Text>{name}</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Description</Text>
              <Text>{description}</Text>
            </View>
            <View style={styles.inputContainer}>
              <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: "100%",
              }}>
                <Text style={commonStyles.inputLabel}>Start Date</Text>
                <Text style={commonStyles.inputLabel}>End Date</Text>
              </View>
              <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: "100%",
              }}>
                <Text>{startDate.toLocaleString()}</Text>
                <Text>{endDate.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Assigned To</Text>
              <Text>{assignedTo}</Text>
            </View> 
            {task.status !== "overdue" && <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Status</Text>
              <View style={styles.border}>
                <Picker
                  style={[commonStyles.input]}
                  selectedValue={status}
                  onValueChange={(itemValue, itemIndex) =>
                    setStatus(itemValue)
                  }>
                  <Picker.Item key="pending" label="Pending" value="pending" />
                  <Picker.Item key="in-progress" label="In Progress" value="in-progress" />
                  <Picker.Item key="completed" label="Completed" value="completed" />
                </Picker>
              </View>
            </View>}
            <View style={[styles.inputContainer]}>
              <Text style={commonStyles.inputLabel}>Status</Text>
            </View>
            <View style={[styles.staticContent]}>
              {statusBadge(task.status,task.end_date)}       
            </View> 
            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Total Cost</Text>        
            </View>            
            <View style={[styles.staticContent]}>
              <Text style={[commonStyles.inputLabel]}>$ {totalCost}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('View Worked Hours', { task: task })}>
                <Text style={[commonStyles.link,commonStyles.underline]}>View Logs</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Comments</Text>        
            </View>            
            <View style={[styles.staticContent,styles.commentContainer]}>              
              <TextInput
                placeholder="Write a comment"
                value={comment}
                onChangeText={setComment}                  
                style={[commonStyles.input]}
                multiline
                numberOfLines={4}
              />              
              <View style={{alignItems: 'center',flexDirection:'row',justifyContent:'space-between'}}>
                <Text></Text>
                <TouchableOpacity style={[commonStyles.button,commonStyles.buttonPrimary,styles.buttonComment]}>
                <Text style={[commonStyles.buttonText, commonStyles.buttonTextPrimary, { fontWeight: 400 }]} onPress={handleAddComment}>
                  ADD COMMENT <Ionicons name="add-circle-outline" size={16}/>
                </Text>
                </TouchableOpacity>
              </View>
              <View>
                {comments.map((item, index) => 
                  <View style={[styles.commentItem]} key={ index }>
                    <Text>{item.comment}</Text>
                    <Text style={[styles.commentAudit]}>{item.commented_by} | {item.comment_date}</Text>
                  </View>                  
                )}
              </View>                          
            </View>
            <View>            
          </View>
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
    marginTop: 20,
    marginBottom: 20,
    width: 'auto',
    position: 'absolute',
    right: 20,
    bottom: 0,    
  }, 
  inputContainer: {
    marginTop: 20,
  },
  ctaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',    
    paddingTop: 60,    
    backgroundColor: theme.colors.white,
    paddingHorizontal: 20,
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
    padding: 20,
  },
  border: {
    borderColor: theme.colors.grey,
    borderWidth: 1,
    borderRadius: 5,
  },
  staticContent: {
    backgroundColor: theme.colors.greyBackground,
    padding: 10,
    borderRadius: 5,
    width: '100%',
    display: 'flex',
  },
  status:{
    width: 100,
    textAlign: 'center',
  },
  badge: {   
    textAlign: 'center',
    marginRight: 5,
    paddingLeft: 20,
    paddingRight: 20,
    width: 100,
  },
  prereqContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  buttonComment: {
    marginTop: 15,
    width: 'auto',
    paddingVertical: 10,    
  }, 
  commentItem: {
    backgroundColor: '#EEEEEE',
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    color: '#414141',
  },
  commentAudit: {
    color: '#9B9B9B',
    textAlign: 'right',
  } 
});

export default ViewTaskScreen;
