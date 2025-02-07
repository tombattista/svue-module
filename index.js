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
import inquirer from 'inquirer';
import path from 'path';

/*-----------------------------------------------------------------
 * Initialization
 *-----------------------------------------------------------------*/
const objectTypes = {
    c: 'component',
    i: 'interface',
    m: 'model',
    s: 'service'
};
const fileStructureTypes = [ 'single', 'multi' ];
let templates = [
    { name: 'SVUE_TEMPLATE_NAME',      objectType: 'any', structureType: 'any',    definition: { src: '',                          value: '', outputFile: '' } },
    { name: 'SVUE_TEMPLATE_STYLETYPE', objectType: 'any', structureType: 'any',    definition: { src: '',                          value: '', outputFile: '' } } /* css/scss/sass */,
    { name: 'SVUE_COMPONENT_VUE',      objectType: 'c',   structureType: 'multi',  definition: { src: 'component-vue.template',    value: '', outputFile: '' } },
    { name: 'SVUE_COMPONENT_HTML',     objectType: 'c',   structureType: 'multi',  definition: { src: 'component-html.template',   value: '', outputFile: '' } },
    { name: 'SVUE_COMPONENT_SCRIPT',   objectType: 'c',   structureType: 'multi',  definition: { src: 'component-script.template', value: '', outputFile: '' } },
    { name: 'SVUE_COMPONENT_STYLE',    objectType: 'c',   structureType: 'multi',  definition: { src: 'component-style.template',  value: '', outputFile: '' } },
    { name: 'SVUE_COMPONENT',          objectType: 'c',   structureType: 'single', definition: { src: 'component.template',        value: '', outputFile: '' } },
    { name: 'SVUE_INTERFACE',          objectType: 'i',   structureType: 'single', definition: { src: 'interface.template',        value: '', outputFile: '' } },
    { name: 'SVUE_MODEL',              objectType: 'm',   structureType: 'single', definition: { src: 'model.template',            value: '', outputFile: '' } },
    { name: 'SVUE_SERVICE',            objectType: 's',   structureType: 'single', definition: { src: 'service.template',          value: '', outputFile: '' } },
];
const nameRegExp = /([A-Z][a-z]*[0-9]*){2,}|\-/g;
const firstLetterCapitalRegExp = /^[A-Z].*/;
const anyLetterCapitalRegExp = /[A-Z]/g;

/*-----------------------------------------------------------------
 * Read command-line args:
 * argv[0] == location of node.exe in the OS file system
 * argv[1] == location of svue index.js at time of execution
 * argv[2] == "generate" or "g"
 * argv[3] == object type to generate:
 *  Options:
 *      - component or c
 *      - interface or i
 *      - model or m
 *      - service or s
 * argv[4] == user-defined name of object to generate
 * arg[5] (optional) == "--f=single" or "--f=multi"
 *  This only applies to object types, such as component, which can
 *  be split into multiple files to segregate functionality.
 *      - e.g. my-component.vue can be split into the following:
 *          - my-component.vue (definition file)
 *          - my-component.template.html
 *          - my-component.script.ts
 *          - mycomponent.style.css
 *-----------------------------------------------------------------*/
 
// Verify parameter count
if (process.argv.length < 5) {
    console.log("Improper parameters specified. Correct syntax is: 'svue generate component my-component-name'.");
    process.exit([-1]);
}

// Get svue-module directory and current working directory
const svueDirectory = path.dirname(process.argv[1]);
const workingDirectory = process.cwd();

// Verify correct input action parameter
const inputAction = process.argv[2];
if (inputAction != "generate" && inputAction != "g") {
    console.log("Improper parameters specified. First parameter can be either 'generate' or 'g'.");
    process.exit([-1]);
}

// Verify correct input type parameter
const inputType = process.argv[3];
const useAbbreviations = inputAction.length == inputType.length == 1;
if (!Object.values(objectTypes).includes(inputType) && !(useAbbreviations && Object.keys(objectTypes).includes(inputType))) {
    console.log(`Improper parameters specified. Options for second parameter are: [${Object.keys(objectTypes).map((s) => s + " (or '" + objectTypes[s] + "')").join(", ")}].`);
    process.exit([-1]);
}


// Get file generation parameters
const typeAbbr = inputType[0];
const newObjectName = formatObjectName(process.argv[4]);
const scriptExtension = getProjectScriptType();
const selectedFileStructureType = getFileStructureType(process.argv);
const selectedTemplates = templates.filter(t => t.objectType == typeAbbr && t.structureType == selectedFileStructureType);

// Prompt user for style type
const answers = await inquirer.prompt([{
        type: 'list',
        name: 'stylesheetFormat',
        message: 'Which stylesheet format would you like to use?',
        choices: ['CSS', 'SCSS', 'Sass'],
    }]);
const styleFormat = answers.stylesheetFormat.toLowerCase();

// Initialize template values
templates.find(t => t.name === 'SVUE_TEMPLATE_NAME').definition.value = newObjectName;
templates.find(t => t.name === 'SVUE_TEMPLATE_STYLETYPE').definition.value = styleFormat;

// configure output filenames
setTemplateOutputFile('SVUE_COMPONENT_VUE', `${newObjectName}.vue`);
setTemplateOutputFile('SVUE_COMPONENT_HTML', `${newObjectName}.template.html`);
setTemplateOutputFile('SVUE_COMPONENT_SCRIPT', `${newObjectName}.script.${scriptExtension}`);
setTemplateOutputFile('SVUE_COMPONENT_STYLE', `${newObjectName}.style.${styleFormat}`);
setTemplateOutputFile('SVUE_COMPONENT', `${newObjectName}.vue`);
setTemplateOutputFile('SVUE_INTERFACE', `${newObjectName}.${scriptExtension}`);
setTemplateOutputFile('SVUE_MODEL', `${newObjectName}.${scriptExtension}`);
setTemplateOutputFile('SVUE_SERVICE', `${newObjectName}.service.${scriptExtension}`);

// Generate new object folder
let folderPath = workingDirectory
if (selectedTemplates.length > 1) {
    folderPath += `\\${newObjectName}`;
    createFolder(folderPath);
}

// Write output files
try {
    selectedTemplates.forEach((template) => {
        const content = getTemplateFileContents(template.name);
        template.definition.value = content == undefined ? '' : content;
    });
} catch (err) {
    console.log(err);
    process.exit(0);
}

// Generate each new object file
selectedTemplates.forEach((template) => {
    writeFileAsync(folderPath, template.definition.outputFile, template.definition.value, newObjectName);
});


/*-----------------------------------------------------------------
 * Functions
 *-----------------------------------------------------------------*/
/*
 * setTypeTemplateValue: Sets value of template.
 */
function setTypeTemplateValue(name, value) {
    return templates.find(t => t.name === name);
}

/*
 * setTemplateOutputFile: Sets outputFile of template.
 */
function setTemplateOutputFile(templateName, outputFileName) {
    let sTemplate = templates.find(t => t.name === templateName);
    if (sTemplate == undefined) { return; }
    sTemplate.definition.outputFile = outputFileName;
}

/*
 * getProjectScriptType: Determines whether or not current project
 *  uses TypeScript.
 * Returns: 'ts' if typescript is found in package.json, otherwise 'js'.
 */
function getProjectScriptType() {
    var projectType = 'js';
    try {
        const packageJson = JSON.parse(getFileContents(`${workingDirectory}/package.json`, 'utf8'));
        if ((packageJson.devDependencies && packageJson.devDependencies.typescript) ||
            (packageJson.dependencies && packageJson.dependencies.typescript)) {
            projectType = 'ts';
        }
    } catch (err) {
        console.error('Error reading package.json:', err);
    }
    return projectType;
}

/*
 * getFileContents: Returns contents of specified file as a string.
 */
function getFileContents(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error(err);
        return '';
    }
}

/*
 * replaceTemplateStrings: Returns contents with template strings replaced by
 *  additional content.
 */
function replaceTemplateStrings(content) {
    let newContent = content;
    templates.forEach((t) => {
        if (newContent.indexOf(t.name) != -1) {
            newContent = newContent.replaceAll(t.name, t.definition.value);
            newContent = replaceTemplateStrings(newContent);
        }
    });
    return newContent;
}

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
        return `${originalName}${capitalize(objectTypes[typeAbbr])}`;
    }
    else if (originalName.match(anyLetterCapitalRegExp)) {
        return capitalize(originalName);
    }
    else {
        return `${originalName}-${objectTypes[typeAbbr]}`;
    }
}

/*
 * capitalize: Function to capitalize first letter of word.
 */
function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

/*
 * getTemplateFileContents: Gets the content associated with the template type
 */
function getTemplateFileContents(templateName) {
    const template = templates.find(t => t.name == templateName);
    const filePath = `${svueDirectory}/templates/${template.definition.src}`;
    const contents = getFileContents(filePath);
    return replaceTemplateStrings(contents);
}

/*
 * getFileStructureType: retrieves .
 */
function getFileStructureType(argv) {
    var parts = argv == null || argv.length < 6 ? [] : argv[5].split('=');
    if (parts.length != 2 || parts[0].toLowerCase() != '--f') { return fileStructureTypes[0]; }

    return fileStructureTypes[1 & (fileStructureTypes.indexOf(parts[1].toLowerCase()) == 1)];
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