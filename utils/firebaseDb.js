const { initializeApp } = require("firebase/app");

const { getFirestore } = require("firebase/firestore");

const StartFirebase = () => {
  const firebaseConfig = {
    apiKey: "AIzaSyCkr7FFrAeCGR1GRo_cUNPyFf5kz8Zm9Ho",
    authDomain: "chatly-9e73d.firebaseapp.com",
    projectId: "chatly-9e73d",
    storageBucket: "chatly-9e73d.appspot.com",
    messagingSenderId: "692360901272",
    appId: "1:692360901272:web:f2e46455a122ed050216ed",
    measurementId: "G-DN2SKEJYP6",
  };

  const app = initializeApp(firebaseConfig);

  return getFirestore(app);
};

module.exports = {
  StartFirebase,
};
