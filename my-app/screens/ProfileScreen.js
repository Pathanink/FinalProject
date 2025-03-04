import { View, Text, Image, Button } from "react-native";
import { auth } from "../firebaseConfig";

const ProfileScreen = ({ navigation }) => {
  return (
    <View>
      <Image source={{ uri: auth.currentUser?.photoURL }} style={{ width: 100, height: 100 }} />
      <Text>Name: {auth.currentUser?.displayName}</Text>
      <Button title="Join a Class" onPress={() => navigation.navigate("JoinClass")} />
    </View>
  );
};

export default ProfileScreen;
