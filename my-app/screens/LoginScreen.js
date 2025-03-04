import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, TouchableOpacity, SafeAreaView } from "react-native";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword, signInWithCredential, PhoneAuthProvider } from "firebase/auth";
import * as WebBrowser from "expo-web-browser";
import * as FirebaseRecaptcha from "expo-firebase-recaptcha";

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState("");
  const recaptchaVerifier = React.useRef(null);

  // ✅ Function to login with Email/Password
  const handleEmailLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace("HomeScreen");
    } catch (error) {
      alert(error.message);
    }
  };

  // ✅ Function to send OTP for phone authentication
  const handlePhoneLogin = async () => {
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(phone, recaptchaVerifier.current);
      setVerificationId(verificationId);
    } catch (error) {
      alert(error.message);
    }
  };

  // ✅ Function to verify OTP
  const verifyOtp = async () => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(auth, credential);
      navigation.replace("HomeScreen");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Login</Text>

      {/* ✅ Email Login */}
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderBottomWidth: 1 }} />
      <TextInput placeholder="Password" value={password} secureTextEntry onChangeText={setPassword} style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <Button title="Login with Email" onPress={handleEmailLogin} />

      {/* ✅ Phone Login */}
      <FirebaseRecaptcha.FirebaseRecaptchaVerifierModal ref={recaptchaVerifier} firebaseConfig={auth.app.options} />

      <TextInput placeholder="Phone Number (+66XXXXXXXXX)" value={phone} onChangeText={setPhone} style={{ borderBottomWidth: 1, marginTop: 20 }} />
      <Button title="Send OTP" onPress={handlePhoneLogin} />

      {verificationId && (
        <>
          <TextInput placeholder="Enter OTP" value={otp} onChangeText={setOtp} style={{ borderBottomWidth: 1, marginTop: 10 }} />
          <Button title="Verify OTP" onPress={verifyOtp} />
        </>
      )}

      {/* ✅ Register Screen */}
      <TouchableOpacity onPress={() => navigation.navigate("RegisterScreen")}>
        <Text style={{ color: "blue", marginTop: 20 }}>ลงทะเบียนเข้าห้องเรียน</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default LoginScreen;
