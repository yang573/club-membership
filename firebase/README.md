# Firebase Stuff Steps
1. Make sure node.js and firebase-cli are installed.
   -Once node is installed,install firebase using ```npm install -g firebase tools``` (installs globally)
2. Login to firebase using firebase login
   -This will give you a link to authenticate with. Use shared email.
3. Select the project for use using this command ```firebase use active-members-sbcs```
4. From here we can edit and make functions for use in firebase/functions/index.js.
   - Feel free to include other node_modules. To do this and make sure firebase knows whats up, 
   install them within firebase folder and make sure to save it like so:
   ```npm install --save MODULE_NAME```
   Then, feel free to use it within the project. 

