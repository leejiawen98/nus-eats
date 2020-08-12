import * as firebase from 'firebase'; 
import firestore from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDdMH30I2GIldWwQ-h-ZBFK7vV1obNwED0",
    authDomain: "nuseats.firebaseapp.com",
    databaseURL: "https://nuseats.firebaseio.com",
    projectId: "nuseats",
    storageBucket: "nuseats.appspot.com",
    messagingSenderId: "465544081834",
    appId: "1:465544081834:web:215c4e6346baf8b8ccbbd3"
} 

firebase.initializeApp(firebaseConfig) 
firebase.firestore()

export default firebase