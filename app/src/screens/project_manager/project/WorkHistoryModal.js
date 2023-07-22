import React, { useState, useEffect } from 'react';
import { Modal, View, Text, FlatList, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { getWorkHistoryByProjectId } from './../../../store/project';
import commonStyles from '../../../theme/commonStyles';
import theme from '../../../theme/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const WorkHistoryModal = () => {
  const navigation = useNavigation();
  const routes = useRoute();
  const { projectId } = routes.params;
  const [workHistory, setWorkHistory] = useState([]);

  useEffect(() => {
    const fetchWorkHistory = async () => {
      if (projectId) {
        const result = await getWorkHistoryByProjectId(projectId);
        setWorkHistory(result);
      }
    };

    fetchWorkHistory();
  }, [projectId]);

  const renderItem = ({ item }) => (
    <View style={[styles.listItem]} >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Time Recorded</Text>
          <Text>{item.hours}h : {item.minutes}m</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Date Recorded</Text>
          <Text>{item.recorded_date}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Total Cost</Text>
          <Text>$ {item.cost}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text>Added By</Text>
        <Text>{item.recorded_by}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.ctaContainer}> 
          <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="close-outline" style={{color:'#D85151'}} size={36} />
          </TouchableOpacity>      
          <Text style={[commonStyles.labelTopNavHeading,commonStyles.bold]}>Worked Hours</Text>
          <TouchableOpacity>
              <Text style={styles.labelhidden}></Text>
          </TouchableOpacity>      
      </View> 
      <View style={styles.modalView}>
          <FlatList
              data={workHistory}
              renderItem={renderItem}
              keyExtractor={(item) => item.task_id.toString()}
          />   
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: theme.colors.white,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: theme.colors.greyBackground,
    borderRadius: 5,
    padding: 10,
  },
  ctaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',    
    paddingTop: 60,    
    backgroundColor: theme.colors.white,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  listItem: {
    marginBottom: 20,
    backgroundColor: theme.colors.greyBackground,
    borderRadius: 5,
    padding: 10,
  },
  labelhidden: {
    opacity: 0,
  },
});

export default WorkHistoryModal;
