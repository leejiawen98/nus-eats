import firebase from '../firebaseDb';

export async function getAllStalls(stallsRetrieved) {
    
    var stallList = [];

    var snapshot = await firebase.firestore()
    .collection('stall')
    .get()

    var snapshotHawker = await firebase.firestore()
    .collection('hawker')
    .get()

    snapshot.forEach((doc) => {
        stallList.push(doc.data());
    })

    snapshotHawker.forEach((doc) => {
        for(var i = 0; i < stallList.length; i ++) {
            if(doc.data().hawkerId == stallList[i].hawkerId) {
                stallList[i]["hawkerName"] = doc.data().hawkerName;
            }
        }
    })

    stallsRetrieved(stallList);

}

export async function getStallByStallId(stallId, stallsRetrieved) {
    
    var stall;

    var snapshot = await firebase.firestore()
    .collection('stall')
    .get()

    snapshot.forEach((doc) => {
        if(doc.data().stallId == stallId) {
            stall = doc.data();
        }
    });

    stallsRetrieved(stall)
}