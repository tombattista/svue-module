# Installation
- Clone project to your local repos directory
- cd into the svue-module directory
  - Run the following from a new terminal window
  ```sh
  npm install -g .
  ```
- Open a Vue project in Visual Studio Code
  - Run the following from a new terminal window:
  ```sh
  cd src/components
  svue generate component NewComponentName
  ```
  - You can alternatively run the following:
  ```sh
  svue g c NewComponentName
  ```

## To link locally, at terminal, run:
  ```sh
  npm link ../svue-module
  ```
## To install the module in your Vue app:
  - Navigate to your Vue app's directory, then at terminal, run:
  ```sh
  npm install ../svue-module
  ```
## Example usages within the Vue app terminal (both are valid): 
  ```sh
  svue generate component my-component-name
  svue g c my-component-name
  ```
- The following types can be generated:
  - component
  - interface
  - model
  - service