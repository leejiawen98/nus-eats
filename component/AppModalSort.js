import React, { Component, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';

const AppModalSort = props => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalText}>
              {props.children}
            </View>
            <View style = {{flexDirection: 'row'}}>
              <TouchableOpacity
                style={{ ...styles.openButton, backgroundColor: "tomato" }}
                onPress={() => {
                  props.onPress()
                  setModalVisible(!modalVisible);
                }}
              >
                <Text style={styles.textStyle}>Sort</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ ...styles.openButton, backgroundColor: "gray" }}
                onPress={() => {
                  setModalVisible(!modalVisible);
                }}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        onPress={() => {
          setModalVisible(true);
        }}
      >
        <Ionicons name="ios-swap" style = {[styles.filterIcon, props.style]} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  openButton: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    flex: 1,
    marginRight: 10,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center"
  },
  filterIcon: {
    color: 'tomato',
    fontSize: 30,
    marginTop: 5,
    alignSelf: 'flex-end',
    marginRight: 15,
    marginBottom: 10,
    transform: [{ rotate: '90deg'}]
  },
});

export default AppModalSort;
