const { StartFirebase } = require("./firebaseDb");
const {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
} = require("firebase/firestore");
const db = StartFirebase();

const createConversationId = async () => {
  const dbref = collection(db, "conversation");
  let val = "";
  try {
    const docRef = await addDoc(dbref, {}).then(async (res) => {
      console.log(res, "this is the resspin");
      console.log("Document written with ID: ", res.id);
      val = res.id;
      const conversationDocRef = doc(db, "conversation", val);
    });
  } catch (error) {
    return false;
  }
  return val;
};

// const saveChats = async (message, id) => {
//   // Create a reference to the parent document that contains the sub-collection
//   const parentDocRef = doc(db, "conversation", id);
//   console.log(id, "iddd");

//   // Create a reference to the sub-collection and order by "createdAt" in descending order
//   const subcollectionRef = collection(parentDocRef, "chat");
//   const { text, type, user } = message;
//   const newMessage = {
//     text: text,
//     type: type,
//     user: user,
//     createdAt: serverTimestamp(),
//   };
//   console.log("here it here", newMessage);
//   // Add a new document to the sub-collection with the current timestamp
//   await addDoc(subcollectionRef, newMessage).then((res) => {
//     // console.log(res, "this is the resspin");
//     console.log("Document written with ID: ", res.id);
//     val = true;
//   });
// };

const saveChats = async (message, id) => {
  console.log(message, id, "trying to save");

  const parentDocRef = doc(db, "conversation", id);
  const subcollectionRef = collection(parentDocRef, "chat");

  const { text, type, user } = message;
  const newMessage = {
    text: text,
    type: type,
    user: user,
    createdAt: serverTimestamp(),
  };

  // Add a new document to the sub-collection with the current timestamp
  await addDoc(subcollectionRef, newMessage).then(async (res) => {
    console.log("Document written with ID: ", res.id);

    // Update the conversation document to indicate that a new message has been added
    await updateDoc(parentDocRef, { newmessage: true });
    console.log("Conversation document updated with newmessage: true");
  });
};

const getConvoChats = async (id) => {
  // Create a reference to the parent document that contains the sub-collection
  const parentDocRef = doc(db, "conversation", id);
  const value = [];

  // Create a reference to the sub-collection
  // const subcollectionRef = collection(parentDocRef, "chat");

  // Create a reference to the sub-collection and order by "createdAt" in descending order
  const subcollectionRef = collection(parentDocRef, "chat");

  const orderedSubcollection = query(
    subcollectionRef,
    orderBy("createdAt", "desc")
  );

  // Get the documents in the sub-collection ordered by "createdAt"
  const querySnapshot = await getDocs(orderedSubcollection);

  // Iterate over the documents in the query snapshot
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
    value.push(doc.data());
  });
};

// export { createConversationId, saveChats, getConvoChats };
module.exports = {
  createConversationId,
  saveChats,
  getConvoChats,
};
