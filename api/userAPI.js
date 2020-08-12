import firebase from '../firebaseDb';
import { Alert } from 'react-native';

export async function addUser(name, email, username, password) {

    var numOfUsers;


    await firebase.firestore()
        .collection('users')
        .get().then(snap => {
            numOfUsers = snap.size;
        })

    numOfUsers++;

    firebase.firestore()
    .collection('users')
    .add({
        name: name,
        email: email,
        username: username,
        password: password,
        profilePic: '',
        refId: '',
        userId: 'U' + (numOfUsers),
        imagePath: "default-profile.jpg"
    }).then((snapshot) => {
      //  firebase.auth().createUserWithEmailAndPassword(email,password);
        Alert.alert("Success", "You have signed up successfully!");
    } ).catch(err => console.error(err));

}

export async function getAllUser(userRetrieved) {

    var userList = [];

    var snapshot = await firebase.firestore()
        .collection('users')
        .get()

    snapshot.forEach((doc) => {
        userList.push(doc.data());
    });

    userRetrieved(userList);
}

export async function updateUser(user, updateCompleted) {

    firebase.firestore()
        .collection('users')
        .doc(user.refId)
        .set(user)
        .then(() => updateCompleted(user))
        .catch((error) => console.log(error));

}

export async function getUserByUsername(username, userRetrieved) {

    var user;

    var snapshot = await firebase.firestore()
        .collection('users')
        .get()

    snapshot.forEach((doc) => {
        if (doc.data().username == username) {
            user = doc.data();
            user.refId = doc.id;
        }
    });

    userRetrieved(user);
}

export async function getUserByUsernameAndPassword(username, password, userRetrieved) {

    var user;

    var snapshot = await firebase.firestore()
        .collection('users')
        .get()

    snapshot.forEach((doc) => {
        if (doc.data().username == username && doc.data().password == password) {
            user = doc.data();
            user.id = doc.id;
        }
    });

    userRetrieved(user);
}

export async function getUserByEmail(email, userRetrieved) {

    var user;

    var snapshot = await firebase.firestore()
        .collection('users')
        .get()

    snapshot.forEach((doc) => {
        if (doc.data().email == email) {
            user = doc.data();
            user.id = doc.id;
        }
    });

    userRetrieved(user);
}

export async function checkUserEmailAndUsername(email, username, userRetrieved) {

    var userList = [];

    var snapshot = await firebase.firestore()
        .collection('users')
        .get()

    snapshot.forEach((doc) => {
        if (doc.data().email == email || doc.data().username == username) {
            userList.push(doc.data());
        }
    });

    userRetrieved(userList);
}

