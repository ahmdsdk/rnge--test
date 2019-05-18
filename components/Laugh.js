import React, { Component } from "react";
import { View, Text, } from "react-native";
import { array, object, string } from 'prop-types';

export default class Laugh extends Component {
  render() {
    const width = this.props.size[0];
    const height = this.props.size[1];
    const x = this.props.body.position.x - width / 2;
    const y = this.props.body.position.y - height / 2;

    return (
      <View
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: width,
          height: height,
          alignItems: "center",
          justifyContent: "center",
        }}>
        <Text style={{color: "white", fontWeight: "bold", fontFamily: "Gotham-Black", fontSize: 35,}}>🤣</Text>
      </View>
    );
  }
};

Laugh.propTypes = {
  size: array,
  body: object,
  color: string
};
