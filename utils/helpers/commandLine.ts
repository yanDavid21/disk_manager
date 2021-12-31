import { Option } from "../types";
const commandLineUsage = require("command-line-usage");

export const optionDefinitions: Option[] = [
  {
    name: "rootdir",
    alias: "d",
    type: String,
    defaultOption: true,
    typeLabel: "{underline filepath}",
    description: "Directory path to start recursive lookup on disk usage.",
  },
  {
    name: "file",
    alias: "f",
    type: String,
    typeLabel: "{underline filepath}",
    description: "File path for file meta data lookup.",
  },
  {
    name: "log",
    alias: "l",
    type: Boolean,
    description:
      "Prints names of all directories analzyed (default depth of 3).",
  },
  {
    name: "count",
    alias: "c",
    type: Boolean,
    description: "Prints number of files and directories accounted for.",
  },
  {
    name: "web",
    alias: "w",
    type: Boolean,
    description: "Starts interactive web server as UI.",
  },
  {
    name: "help",
    alias: "h",
    type: Boolean,
    description: "Print this usage guide",
  },
];

export const handlePrintStatement = (options) => {
  if (options.help || Object.keys(options).length === 0) {
    const sections = [
      {
        header: "Disk Manager",
        content: "Manage and visualize your disk usage.",
      },
      {
        header: "Options",
        optionList: optionDefinitions.map((option) => {
          return {
            name: option.name,
            typeLabel:
              option === null || option === void 0 ? void 0 : option.typeLabel,
            description: option.description,
          };
        }),
      },
    ];
    const usage = commandLineUsage(sections);
    console.log(usage);
  }
};
