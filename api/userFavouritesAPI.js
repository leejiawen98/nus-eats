import firebase from '../firebaseDb';

//CREATE 
export function addFavourites(stallId, userId, addFavouritesSuccess) {

    firebase.firestore()
        .collection('users')
        .add({
            stallId: stallId,
            userId: userId
        }).then((snapshot) => addFavouritesSuccess).catch(err => console.error(err));

}

//RETRIEVE
export async function getFavouritesByUserId(userId, allFavouritesRetrieved) {

    var favouriteList = [];
    var stallList = [];
    var hawkerList = [];
    var favRefId = '';

    var snapshot = await firebase.firestore()
        .collection('userFavourite')
        .get()

    var snapshotStall = await firebase.firestore()
        .collection('stall')
        .get()

    var snapshotHawker = await firebase.firestore()
        .collection('hawker')
        .get()

    snapshot.forEach((doc) => {
        if (doc.data().userId == userId) {
            favouriteList.push(doc.data());

        }
    })

    snapshotStall.forEach((doc) => {
        for (var i = 0; i < favouriteList.length; i++) {
            if (doc.data().stallId == favouriteList[i].stallId) {
                stallList.push({
                    ...doc.data(),
                    refId: favouriteList[i].refId});
                
            }
        }
    });

    snapshotHawker.forEach((doc) => {
        for(var i = 0; i < stallList.length; i ++) {
            if(doc.data().hawkerId == stallList[i].hawkerId) {
                stallList[i]["hawkerName"] = doc.data().hawkerName;
            }
        }
    })


    allFavouritesRetrieved(stallList);
}
