import React from "react";

import { ChatCompletionMessageParam } from "openai/resources";
import { ToolResult } from "./tool-controller";
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

export const ChatBubble = ({ message, role = "none" }: { message: ChatCompletionMessageParam | ToolResult | null, role?: string }) => {
    if (message === null) {
      return (
        // <div className="chat chat-start">
        //   <div className="chat-bubble chat-bubble-info">
        //     <img src={(message as ToolResult).image} alt="page preview" />
        //   </div>
        // </div>
        <Alert severity="success">Done</Alert>
      );
    }
    if ("role" in message) {
      return (
        <Card>
          <CardContent>
            {Array.isArray(message.content) ? (
              message.content.map((contentPart, index) => {
                if (contentPart && "text" in contentPart) {
                  return <Typography key={index}>{contentPart.text}</Typography>;
                } else if (contentPart && "image_url" in contentPart) {
                  return <img key={index} src={contentPart.image_url.url} alt="content part" />;
                }
              })
            ) : typeof message.content === "string" ? (
              <Typography>{message.content}</Typography>
            ) : null}
          </CardContent>
        </Card>
      );
    }
    if ("status" in message) {
      return (
        // <div className="chat chat-end">
        //   <div className="chat-bubble chat-bubble-accent">
        //     {(message as ToolResult).message}:{(message as ToolResult).reason}:{message.status === "Success" ? "✅" : "❌"}
        //   </div>
        // </div>
        <Alert severity="info">
        {(message as ToolResult).message}:{(message as ToolResult).reason}:{message.status === "Success" ? "✅" : "❌"}
        </Alert>
      );
    }
    if ("image" in message) {
      return (
        // <div className="chat chat-start">
        //   <div className="chat-bubble chat-bubble-info">
        //     <img src={(message as ToolResult).image} alt="page preview" />
        //   </div>
        // </div>
        <Alert severity="info">
          <AlertTitle>page preview</AlertTitle>
          <img src={(message as ToolResult).image} alt="page preview" />
        </Alert>
      );
    }
  };