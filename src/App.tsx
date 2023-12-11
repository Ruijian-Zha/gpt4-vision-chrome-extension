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
import { addUniqueTags } from './extension-helper';


export const App: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasPreviousState, setHasPreviousState] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<string>("1");

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

  const handleAddUniqueTags = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await addUniqueTags();
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };

  const handleReset = () => {
    // Clear the input
    setInput("");
    
    // Clear the textarea
    if (textareaRef.current) {
      textareaRef.current.value = "";
    }
    
    // Clear the Chrome storage
    chrome.storage.local.clear(function() {
      var error = chrome.runtime.lastError;
      if (error) {
        console.error(error);
      }
    });
    
    // Reset other state variables if necessary
    setHasPreviousState(false);
    setLoading(false);
  
    // Refresh the current active tab in the browser
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        //@ts-ignore
        chrome.tabs.reload(tabs[0].id);
      }
    });
  };
  

  return (
    <Box sx={{ width: '100%', typography: 'body1', margin: ['10px', '10px', '10px', '10px'] }}>
      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList 
            onChange={(event, newValue) => setTabValue(newValue)} 
            aria-label="lab API tabs example"
          >
            <Tab label="Web Agent" value="1" />
            <Tab label="Segmentation" value="2" />
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
            <Box display="flex" alignItems="center" justifyContent="center">
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
              >
                Submit
              </Button>
              <Box mx={2}> {/* This will add space between the buttons */}
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          </form>
        </TabPanel>
        
        <TabPanel value="2">
          <form className="flex flex-col" onSubmit={handleAddUniqueTags}>
            <Box display="flex" alignItems="center" justifyContent="center">
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
              >
                Add Unique Tags
              </Button>
              <Box mx={2}> {/* This will add space between the buttons */}
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          </form>
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

