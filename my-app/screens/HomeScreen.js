import { View, Text, Button, TextInput, Image } from "react-native";
import { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import QRScanner from "../components/QRScanner";

const HomeScreen = () => {
  const user = auth.currentUser;
  const [cid, setCid] = useState("");
  const [stdid, setStdid] = useState("");
  const [name, setName] = useState(user?.displayName || "");

  const joinClass = async (classId) => {
    try {
      const uid = user.uid;
      await setDoc(doc(db, `classroom/${classId}/students`, uid), {
        stdid,
        name
      });
      await setDoc(doc(db, `users/${uid}/classroom`, classId), { status: 2 });
      alert("Joined class successfully!");
    } catch (error) {
      alert("Error joining class: " + error.message);
    }
  };

  return (
    <View>
      <Image source={{ uri: user?.photoURL }} style={{ width: 100, height: 100 }} />
      <Text>Name: {user?.displayName}</Text>
      <TextInput placeholder="Enter Class ID" onChangeText={setCid} value={cid} />
      <TextInput placeholder="Enter Student ID" onChangeText={setStdid} value={stdid} />
      <Button title="Join by Class ID" onPress={() => joinClass(cid)} />
      <QRScanner onScan={joinClass} />
    </View>
  );
};

export default HomeScreen;
