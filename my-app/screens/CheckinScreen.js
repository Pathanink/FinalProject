import { View, TextInput, Button } from "react-native";
import { useState } from "react";
import { db, auth } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

const CheckinScreen = ({ route }) => {
  const { classId } = route.params;
  const [code, setCode] = useState("");

  const submitCheckin = async () => {
    const checkinRef = doc(db, "classroom", classId, "checkin", code);
    const checkinDoc = await getDoc(checkinRef);

    if (checkinDoc.exists()) {
      const studentRef = doc(db, "classroom", classId, "checkin", code, "students", auth.currentUser.uid);
      await setDoc(studentRef, {
        name: auth.currentUser.displayName,
        date: new Date().toISOString(),
        status: 1
      });
      alert("Check-in successful!");
    } else {
      alert("Invalid check-in code!");
    }
  };

  return (
    <View>
      <TextInput placeholder="Enter Check-in Code" onChangeText={setCode} value={code} />
      <Button title="Submit Check-in" onPress={submitCheckin} />
    </View>
  );
};

export default CheckinScreen;
