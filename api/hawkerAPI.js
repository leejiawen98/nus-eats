import firebase from '../firebaseDb';

export async function getAllHawker(hawkerRetrieved) {

    var hawkerList = [];

    var snapshot = await firebase.firestore()
    .collection('hawker')
    .get()

    snapshot.forEach((doc) => {
        hawkerList.push(doc.data());
    });

    hawkerRetrieved(hawkerList);
}