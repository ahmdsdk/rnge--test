import React, { Component } from "react";
import { View } from "react-native";
import { array, object, string } from 'prop-types';

export default class Circle extends Component {
  render() {
    const width = this.props.size[0];
    const height = this.props.size[1];
    const x = this.props.body.position.x - width / 2;
    const y = this.props.body.position.y - height / 2;
    const color = this.props.color;
    const borderColor = this.props.borderColor;

    return (
      <View
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: width,
          height: height,
          backgroundColor: color,
          borderWidth: 1,
          borderRadius: width/2,
          borderColor: borderColor,
        }} />
    );
  }
};

Circle.propTypes = {
  size: array,
  body: object,
  color: string,
  borderColor: string,
};
