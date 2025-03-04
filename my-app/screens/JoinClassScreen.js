import { View, TextInput, Button } from "react-native";
import { useState } from "react";
import { db, auth } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

const JoinClassScreen = () => {
  const [classId, setClassId] = useState("");

  const joinClass = async () => {
    const classRef = doc(db, "classroom", classId);
    const classDoc = await getDoc(classRef);

    if (classDoc.exists()) {
      const studentRef = doc(db, "classroom", classId, "students", auth.currentUser.uid);
      await setDoc(studentRef, {
        name: auth.currentUser.displayName,
        photo: auth.currentUser.photoURL || "",
        status: 1
      });
      alert("Joined class successfully!");
    } else {
      alert("Class ID not found!");
    }
  };

  return (
    <View>
      <TextInput placeholder="Enter Class ID" onChangeText={setClassId} value={classId} />
      <Button title="Join" onPress={joinClass} />
    </View>
  );
};

export default JoinClassScreen;
