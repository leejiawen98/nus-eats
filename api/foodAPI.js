import firebase from '../firebaseDb';

export async function getAllFood(foodRetrieved) {

    var foodList = [];

    var snapshotFood = await firebase.firestore()
    .collection('food')
    .get()

    var snapshot = await firebase.firestore()
    .collection('stall')
    .get()

    snapshotFood.forEach((doc) => {
        foodList.push(doc.data());
    })

    snapshot.forEach((doc) => {
        for(var i = 0; i < foodList.length; i ++) {
            if(doc.data().stallId == foodList[i].stallId) {
                foodList[i]["stallName"] = doc.data().stallName;
            }
        }
    })

    foodRetrieved(foodList);
}