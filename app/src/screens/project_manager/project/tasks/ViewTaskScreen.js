import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import commonStyles from '../../../../theme/commonStyles';
import theme from '../../../../theme/theme';
import { Picker } from '@react-native-picker/picker';
import { getAvailableUser }  from '../../../../store/user';
import { updateTask, listPrerequisite, addTaskComment, getTaskComments, calculateWorkedHour } from '../../../../store/project';
import { Ionicons } from '@expo/vector-icons';
import {statusBadge} from '../../../../common/Status';

const ViewTaskScreen = () => {
  const route = useRoute();
  const { project, task } = route.params;
  const navigation = useNavigation();
  console.log(task)
  
  const [id, _] = useState(task.id);
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description);
  const [startDate, setStartDate] = useState(new Date(task.start_date));
  const [endDate, setEndDate] = useState(new Date(task.end_date));
  const [assignedTo, setAssignedTo] = useState(task.assigned_to);
  const [status, setStatus] = useState(task.status);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [users, setUsers] = useState([]);
  const [preReq, setRreReq] = useState([]);
  const [totalCost, serTotalCost] = useState('0.00');

  const [comment, setComment] = useState();
  const [comments, setComments] = useState([]);
 
  useFocusEffect(
    useCallback(() => {
      const fetchPreReq = async () => {
        const results = await listPrerequisite(task.id);
        setRreReq(results);
      };

      const fetchUsers = async () => {
        const results = await getAvailableUser();
        setUsers(results);
      };

      const fetchComments = async () => {
        const results = await getTaskComments(task.id);
        setComments(results);
      };

      const fetchTotalCost = async () => {
        const results = await calculateWorkedHour(task.id);
        serTotalCost(results);
      };

      fetchUsers();
      fetchPreReq();
      fetchComments();
      fetchTotalCost();
    }, [task])
  );

  const handleUpdateTask = async () => {
    // Validate that start date is before end date
    if (!name || !description || !startDate || !endDate) {
      // Handle case when email is empty
      Alert.alert('Error','Please complete the form before submit.');
      return;
    }

    if (startDate > endDate) {
      Alert.alert('Error', 'Start date should be before end date.');
      return;
    }

    console.log("GO: ")
    // Create a new task object
    const data = {
      id: id,
      name: name,
      description: description,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      assigned_to: assignedTo,
      status: status,
      project_id: task.project_id,
    };

    try {
      // Create the task in the database
      await updateTask(data);
      Alert.alert("Success", "Task has been updated.");
    } catch (error) {
      // Handle or display error if something goes wrong
      console.error(error);
      Alert.alert('Error', 'There was an error while creating the task.');
    }
  }

  const handleAddComment = async () => {
    await addTaskComment(comment, id);
    const results = await getTaskComments(task.id);
    setComments(results);
    setComment('');
  }

  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  }

  const onEndDateChange = (event, selectedDate) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
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
              <TextInput
                  placeholder="Name"
                  value={name}
                  onChangeText={setName}
                  style={commonStyles.input}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Description</Text>
              <TextInput
                  placeholder="Description"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  style={[commonStyles.input,{ height: 140 }]}
              />   
            </View>
            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Start Date</Text>
              <TouchableOpacity onPress={() => setShowStartPicker(true)}>
                  <TextInput
                      placeholder="Start Date"
                      value={startDate.toLocaleString()}
                      editable={false}
                      style={[commonStyles.input]}
                  />
                  {showStartPicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="datetime"
                      display="default"
                      onChange={onStartDateChange}
                    />
                  )}
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>End Date</Text>
              <TouchableOpacity onPress={() => setShowEndPicker(true)}>
                <TextInput
                    placeholder="End Date"
                    value={endDate.toLocaleString()}
                    editable={false}
                    style={[commonStyles.input]}
                />
                {showEndPicker && (
                  <DateTimePicker
                    value={endDate}
                    mode="datetime"
                    display="default"
                    onChange={onEndDateChange}
                  />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Assigned To</Text>
              <View style={styles.border}>
                <Picker
                  style={[commonStyles.input]}
                  selectedValue={assignedTo}
                  onValueChange={(itemValue, itemIndex) =>
                    setAssignedTo(itemValue)
                  }>
                  {users?.map((user, index) => <Picker.Item key={user.email} label={user.email} value={user.email} />)}
                </Picker>
              </View> 
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
              {statusBadge(task.status, task.end_date)}       
            </View> 
            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Total Cost</Text>        
            </View>            
            <View style={[styles.staticContent]}>
              <Text style={[commonStyles.inputLabel]}>$ {totalCost}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Task Work History', { task: task })}>
                <Text style={[commonStyles.link,commonStyles.underline]}>View Logs</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Prerequisite</Text>        
            </View>            
            <View style={[styles.staticContent]}>
              <View style={[styles.prereqContainer]}>
              {preReq.map((preitem, index) => <Text key={ index } style={[commonStyles.badge, commonStyles.badgeGrey,styles.badge]}>#{preitem.prerequisite_task_id}</Text>)}
              </View>              
              <TouchableOpacity onPress={() => navigation.navigate('Pre Req Task', { project, task })}>
                <Text style={[commonStyles.link,commonStyles.underline]}>Update Prerequisites</Text>
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
                <>
                    <View style={[styles.commentItem]} key={ index }>
                    <Text>{item.comment}</Text>
                    <Text style={[styles.commentAudit]}>{item.commented_by} | {item.comment_date}</Text>
                  </View>                  
                </>)}
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
    paddingHorizontal: 10,
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
