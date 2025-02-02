#!/usr/bin/env node
/**********************************************************************
 * svue-module (Segregate Vue)
 * -------------------------------------------------------------------
 * - To link locally, at terminal, run:
 *      > npm link ../svue-module
 * - To install the module in your Vue app:
 *		- Navigate to your Vue app's directory, then at terminal, run:
 *  	> npm install ../svue-module
 * - Example usages within the Vue app terminal (both are valid): 
 *		> svue generate component my-component-name
 *		> svue g c my-component-name
 **********************************************************************/
 import fs from 'fs';

 const nameRegExp = /([A-Z][a-z]*[0-9]*){2,}|\-/g;
 const firstLetterCapitalRegExp = /^[A-Z].*/;
 const anyLetterCapitalRegExp = /[A-Z]/g;

/*
 * reset: Removes any written content and exits.
 */
async function reset(folderPath) {
    fs.rmdir(folderPath, () => {
        process.exit([-1]);
    });
}
 
/*
 * createFolder: Function to write folder to file system.
 */
async function createFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdir(folderPath, (err) => {
            if (err) {
                console.error(err);
                reset(folderPath);
            } 
        });
    }
}

/*
 * formatObjectName: Function to format object name to have at least two words.
 */
function formatObjectName(originalName) {
    if (typeAbbr != 'c') return originalName;

    // name must have at least 2 capital letters or at least one hyphen
    if (originalName.match(nameRegExp)) return originalName;
    else if (originalName.match(firstLetterCapitalRegExp)) {
        return `${originalName}${capitalize(validTypes[typeAbbr])}`;
    }
    else if (originalName.match(anyLetterCapitalRegExp)) {
        return capitalize(originalName);
    }
    else {
        return `${originalName}-${validTypes[typeAbbr]}`;
    }
}

/*
 * capitalize: Function to capitalize first letter of word.
 */
function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

/*
 * writeFileAsync: Function to write templates to file system.
 */
async function writeFileAsync(folderPath, fileName, fileContent, newObjectName) {
    var filePath = `${folderPath}\\${fileName}`;
    try {
        await fs.writeFile(filePath, fileContent, (err) => {
            if (err) {
                console.error(err);
                process.exit([-1]);
            } 
        });
        console.log(`${newObjectName}/${fileName} has been generated successfully.`);
    } catch (error) {
        console.error(`An error occurred while generating ${filePath}:`, error);
    }
}
 
// Verify parameter count
if (process.argv.length != 5) {
    console.log("Improper parameters specified. Correct syntax is: 'svue generate component my-component-name'.");
    process.exit([-1]);
}

const inputAction = process.argv[2];
const inputType = process.argv[3];
const useAbbreviations = inputAction.length == inputType.length == 1;

// Verify correct input action parameter
if (inputAction != "generate" && !(useAbbreviations && inputAction == "g")) {
    console.log("Improper parameters specified. First parameter can be either 'generate' or 'g'.");
    process.exit([-1]);
}

const validTypes = {
    c: 'component',
    i: 'interface',
    m: 'model'
};

// Verify correct input type parameter
if (!Object.values(validTypes).includes(inputType) && !(useAbbreviations && Object.keys(validTypes).includes(inputType))) {
    console.log(`Improper parameters specified. Options for second parameter are: [${Object.keys(validTypes).map((s) => s + " (or '" + validTypes[s] + "')").join(", ")}].`);
    process.exit([-1]);
}

// Generate files
const typeAbbr = inputType[0];
const newObjectName = formatObjectName(process.argv[4]);
const scriptExtension = 'ts';
const styleExtension = 'css';

const typeFilenames = {
    c: {
        component: `${newObjectName}.vue`,
        html: `${newObjectName}.template.html`,
        script: `${newObjectName}.script.${scriptExtension}`,
        style: `${newObjectName}.style.${styleExtension}`
    },
    i: { interface: `${newObjectName}.${scriptExtension}`},
    m: { model: `${newObjectName}.${scriptExtension}`}
}

const typeTemplates = {
    c: {
        component: `<!-- ${newObjectName} component -->
<template src="./${typeFilenames['c']['html']}"></template>
<script lang="${scriptExtension}" src="./${typeFilenames['c']['script']}"></script>
<style scoped src="./${typeFilenames['c']['style']}"></style>
        `,
        html: `<!-- ${newObjectName} component HTML -->
<div><h2>{{ innerTitle }}</h2></div>
        `,
        script: `/* ${newObjectName} component script */
import { defineComponent } from 'vue';

export default defineComponent({
  props: ['title'],
  data() {
    return {
      innerTitle: this.title
    };
  },
  watch: {
    title(newTitleValue) {
      this.innerTitle = newTitleValue;
    }
  },
  methods: {
    emitUpdate() {
      this.$emit('update-title', this.innerTitle);
    }
  }
});
    `,
        style: `/* ${newObjectName} styles */`
    },
    i: {
        interface: `/* ${newObjectName} interface */
export interface ${newObjectName} {}
    `
    },
    m: {
        model: `// ${newObjectName} model
export default class ${newObjectName} {
    constructor() {}
}`
    }
}

// Write each file to file system
const workingDirectory = process.cwd();
var folderPath = workingDirectory;
if (Object.keys(typeFilenames[typeAbbr]).length > 1) {
    folderPath += `\\${newObjectName}`;
    createFolder(folderPath);
}

Object.keys(typeFilenames[typeAbbr]).forEach(key => {
    var fileName = `${typeFilenames[typeAbbr][key]}`;
    var fileContent = typeTemplates[typeAbbr][key];
    writeFileAsync(folderPath, fileName, fileContent, newObjectName);
});
