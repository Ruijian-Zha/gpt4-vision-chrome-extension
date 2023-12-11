import React, { useRef, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import {
  getChromeStorage,
} from "./extension-helper";
import { useAI } from "./useAI";
import { ChatCompletionMessageParam } from "openai/resources";
import { ToolResult } from "./tool-controller";
import { ChatBubble } from "./ChatBubble";

export const App: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasPreviousState, setHasPreviousState] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    getChromeStorage("chatData").then((chatData) => {
      setHasPreviousState(Boolean(chatData));
    });
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (textareaRef.current) {
      const inputValue = textareaRef.current.value;
      setInput(inputValue); 
    }
  };
  

  return (
    
    <Box sx={{ width: '100%', typography: 'body1', margin: ['10px', '10px', '10px', '10px'] }}>
      <TabContext value={"1"}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={() => {}} aria-label="lab API tabs example">
            <Tab label="Item One" value="1" />
            <Tab label="Item Two" value="2" />
            <Tab label="Item Three" value="3" />
          </TabList>
        </Box>
        <TabPanel value="1">
    
          <form className="flex flex-col" onSubmit={handleSubmit}>
            {(input || hasPreviousState) && <AIChat input={input} />}
            <Box>
              <TextField
                label="Your Request"
                variant="outlined"
                fullWidth
                inputRef={textareaRef}
                multiline
                margin="normal"
                placeholder="Enter task description"
              />
            </Box>
            <Box>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
              >
                Submit
              </Button>
            </Box>
          </form>
        </TabPanel>
        
        <TabPanel value="2">
        Item Two
        </TabPanel>
        <TabPanel value="3">Item Three</TabPanel>
      </TabContext>
    </Box>

  );
};

// whenever the data changes, scroll down to the last message
const AIChat = ({ input }: { input: string }) => {
  const data = useAI(input);

  React.useEffect(() => {
    if (data.length === 0) return;
    let element = document.getElementById("list-end");
    element?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
  }, [data]);

  return (
    <div className="flex flex-col gap-4">
      {data?.map((message: ChatCompletionMessageParam | ToolResult | null, index: number) => (
        <ChatBubble key={index} message={message} role={message ? ('role' in message ? message.role : "") : ""} />
      ))}
      <div id="list-end" className="h-8" />
    </div>
  );
};

