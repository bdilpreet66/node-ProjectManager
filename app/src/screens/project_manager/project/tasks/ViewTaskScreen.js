import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import commonStyles from '../../../../theme/commonStyles';
import theme from '../../../../theme/theme';
import { Picker } from '@react-native-picker/picker';
import { getAllUsers } from '../../../../store/user';
import { updateTask, listPrerequisites, addTaskComment, getTaskComments, calculateWorkedHour, getTaskById } from '../../../../store/project';
import { Ionicons } from '@expo/vector-icons';
import { statusBadge } from '../../../../common/Status';

const ViewTaskScreen = () => {
	const route = useRoute();
	const { taskid } = route.params;
	const [task, setTask] = useState({
		_id: taskid,
		name: "",
		description: "",
		start_date: new Date(),
		end_date: new Date(),
		assigned_to: "",
		is_active: true,
		status: "pending",
		project_id: "",
	});
	const navigation = useNavigation();

	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);
	const [users, setUsers] = useState([]);
	const [preReq, setRreReq] = useState([]);
	const [totalCost, setTotalCost] = useState('0.00');

	const [comment, setComment] = useState();
	const [comments, setComments] = useState([]);

	useFocusEffect(
		useCallback(() => {
			const fetchPreReq = async () => {
				try{
					const results = await listPrerequisites(taskid);
					setRreReq(results);
				} catch(error) {
					console.log(error)
				}
			};

			const fetchUsers = async () => {
				try{
					const results = await getAllUsers();
					setUsers(results);
				} catch(error) {
					console.log(error)
				}
			};

			const fetchComments = async () => {
				try{
					const results = await getTaskComments(taskid);
					setComments(results);
				} catch(error) {
					console.log(error)
				}
			};

			const fetchTotalCost = async () => {
				try{
					const results = await calculateWorkedHour(taskid);
					setTotalCost(results);
				} catch(error) {
					console.log(error)
				}
			};

			const fetchTaskDetails = async () => {
				try{
					const result = await getTaskById(taskid);
					if(result){
						setTask({ ...result, end_date: new Date(result.end_date), start_date: new Date(result.start_date) });
					}
				} catch {
					Alert.alert("Error", "Unable To get the Task.");
					navigation.goBack();
				}
			};

			fetchTaskDetails();
			fetchUsers();
			fetchPreReq();
			fetchComments();
			fetchTotalCost();

		}, [])
	);

	const handleUpdateTask = async () => {
		// Validate that start date is before end date
		if (!task.name || !task.description) {
			// Handle case when email is empty
			Alert.alert('Error', 'Please complete the form before submit.');
			return;
		}

		if (task.startDate > task.endDate) {
			Alert.alert('Error', 'Start date should be before end date.');
			return;
		}


		try {
			// Create the task in the database
			await updateTask(task);
			Alert.alert("Success", "Task has been updated.");
		} catch (error) {
			// Handle or display error if something goes wrong
			console.error(error);
			Alert.alert('Error', 'There was an error while updating the task.');
		}
	}

	const handleAddComment = async () => {		
		if (comment !== undefined) {
			await addTaskComment(comment, task._id);
			const results = await getTaskComments(task._id);
			setComments(results);
			setComment('');
		}		
	}

	const onStartDateChange = (selectedDate) => {
		setShowStartPicker(false);
		if (selectedDate) {
			setTask ({ ...task, start_date: new Date(selectedDate) });
		}
	};

	const onEndDateChange = (selectedDate) => {
		setShowEndPicker(false);
		if (selectedDate) {
			setTask ({ ...task, end_date: new Date(selectedDate) });
		}
	};


	return (
		<View style={styles.scroll}>

			<View style={styles.ctaContainer}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Ionicons name="close-outline" style={{ color: '#D85151' }} size={36} />
				</TouchableOpacity>
				<Text style={[commonStyles.labelTopNavHeading, commonStyles.bold]}>Task Details</Text>
				<TouchableOpacity onPress={handleUpdateTask}>
					<Ionicons name="checkmark-outline" style={{ color: '#34A654' }} size={36} />
				</TouchableOpacity>
			</View>

			<ScrollView>
				<View style={[commonStyles.container, styles.container]}>
					<View style={styles.inputContainer}>
						<Text style={commonStyles.inputLabel}>Name</Text>
						<TextInput
							placeholder="Name"
							value={task.name}
							onChangeText={ (val) => setTask({ ...task, name: val }) }
							style={commonStyles.input}
						/>
					</View>
					<View style={styles.inputContainer}>
						<Text style={commonStyles.inputLabel}>Description</Text>
						<TextInput
							placeholder="Description"
							value={task.description}
							onChangeText={ (val) => setTask({ ...task, description: val }) }
							multiline
							numberOfLines={4}
							style={[commonStyles.input, { height: 140,textAlignVertical:'top' }]}
						/>
					</View>
					<View style={styles.inputContainer}>
						<Text style={commonStyles.inputLabel}>Start Date</Text>
						<TouchableOpacity onPress={() => setShowStartPicker(true)}>
							<TextInput
								placeholder="Start Date"
								value={task.start_date.toLocaleString()}
								editable={false}
								style={[commonStyles.input]}
							/>
							{showStartPicker && (
								<DateTimePicker
									value={task.start_date}
									mode="datetime"
									display="default"
									onChange={(event, selectedDate) => onStartDateChange(selectedDate)} // Update this line
								/>
							)}
						</TouchableOpacity>
					</View>
					<View style={styles.inputContainer}>
						<Text style={commonStyles.inputLabel}>End Date</Text>
						<TouchableOpacity onPress={() => setShowEndPicker(true)}>
							<TextInput
								placeholder="End Date"
								value={task.end_date.toLocaleString()}
								editable={false}
								style={[commonStyles.input]}
							/>
							{showEndPicker && (
								<DateTimePicker
									value={task.end_date}
									mode="datetime"
									display="default"
									onChange={(event, selectedDate) => onEndDateChange(selectedDate)} // Update this line
								/>
							)}
						</TouchableOpacity>
					</View>
					<View style={styles.inputContainer}>
						<Text style={commonStyles.inputLabel}>Assigned To</Text>
						<View style={styles.border}>
							<Picker
								style={[commonStyles.input]}
								selectedValue={task.assigned_to}
								onValueChange={ (val) => setTask({ ...task, assigned_to: val }) }>
								{users?.map((user, index) => <Picker.Item key={user.email} label={user.email} value={user._id} />)}
							</Picker>
						</View>
					</View>
					{task.status !== "overdue" && <View style={styles.inputContainer}>
						<Text style={commonStyles.inputLabel}>Status</Text>
						<View style={styles.border}>
							<Picker
								style={[commonStyles.input]}
								selectedValue={task.status}
								onValueChange={ (val) => setTask({ ...task, status: val }) }>
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
						<Text style={[commonStyles.inputLabel]}>$ {parseFloat(task.cost).toFixed(2)}</Text>
						<TouchableOpacity onPress={() => navigation.navigate('Task Work History', { task: task._id })}>
							<Text style={[commonStyles.link, commonStyles.underline]}>View Logs</Text>
						</TouchableOpacity>
					</View>
					<View style={styles.inputContainer}>
						<Text style={commonStyles.inputLabel}>Prerequisite</Text>
					</View>
					<View style={[styles.staticContent]}>
						<View style={[styles.prereqContainer]}>
							{preReq.map((preitem, index) => <Text key={index} style={[commonStyles.badge, commonStyles.badgeGrey, styles.badge]}>{preitem}</Text>)}
						</View>
						<TouchableOpacity onPress={() => navigation.navigate('Pre Req Task', { project: task.project_id , task: task._id })}>
							<Text style={[commonStyles.link, commonStyles.underline]}>Update Prerequisites</Text>
						</TouchableOpacity>
					</View>
					<View style={styles.inputContainer}>
						<Text style={commonStyles.inputLabel}>Comments</Text>
					</View>
					<View style={[styles.staticContent, styles.commentContainer]}>
						<TextInput
							placeholder="Write a comment"
							value={comment}
							onChangeText={setComment}
							style={[commonStyles.input,{textAlignVertical:'top'}]}
							multiline
							numberOfLines={4}
						/>
						<View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
							<Text></Text>
							<TouchableOpacity style={[commonStyles.button, commonStyles.buttonPrimary, styles.buttonComment]}>
								<Text style={[commonStyles.buttonText, commonStyles.buttonTextPrimary, { fontWeight: 400 }]} onPress={handleAddComment}>
									ADD COMMENT <Ionicons name="add-circle-outline" size={16} />
								</Text>
							</TouchableOpacity>
						</View>
						<View>
							{comments.map((item) =>
								<View key={item._id}>
									<View style={[styles.commentItem]}>
										<Text>{item.comment}</Text>
										<Text style={[styles.commentAudit]}>{item.commented_by} | {item.comment_date}</Text>
									</View>
								</View>)
							}
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
	status: {
		width: 100,
		textAlign: 'center',
	},
	badge: {
		textAlign: 'center',
		marginRight: 5,
		paddingLeft: 20,
		paddingRight: 20,
		marginBottom:5,
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
