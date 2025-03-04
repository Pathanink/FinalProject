import { BarCodeScanner } from "expo-barcode-scanner";
import { useState, useEffect } from "react";
import { View, Button, Text } from "react-native";

const QRScanner = ({ onScan }) => {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  return (
    <View>
      {hasPermission === null ? (
        <Text>Requesting for camera permission...</Text>
      ) : hasPermission === false ? (
        <Text>No access to camera</Text>
      ) : (
        <BarCodeScanner
          onBarCodeScanned={({ data }) => onScan(data)}
          style={{ height: 400, width: 400 }}
        />
      )}
      <Button title="Scan Again" onPress={() => setScanned(false)} />
    </View>
  );
};

export default QRScanner;
