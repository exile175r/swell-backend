import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const TestScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>너울 (Swell) - Test</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Login")}>
        <Text style={styles.buttonText}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#001220",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    color: "#E0E0E0",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#00E0D0",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#001220",
    fontWeight: "bold",
  },
});

export default TestScreen;
