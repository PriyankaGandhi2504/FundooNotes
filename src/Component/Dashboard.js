import React, { Component } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, Button, Alert } from 'react-native'
import styles from './StyleSheets'
import CreateNote from './CreateNote'
import { AsyncStorage } from 'react-native'
import firebase from '../Firebase'
import ImagePicker from 'react-native-image-picker'
import userData from '../../UserServices'
const UserData = new userData
import ToggleSearchBar from './ToggleSearchBar'
import Note from './Note'
import DefaultSearchBar from './DefaultSearchBar'
import SearchNote from './SearchNote'
import moment from 'moment';
import PushNotification from 'react-native-push-notification'
import FastImage from 'react-native-fast-image'
import { Avatar } from 'react-native-paper'
import firebaseNotify from 'react-native-firebase';

var list = require('../Assets/List.png')
var grid = require('../Assets/Grid.png')
var currentDate = moment().format('D-MM-YYYY h:mm a')
var profileImage = profileImage;
var userDataValue, updatedProfile, userID
var currentUser, reminderValue, noteValue, titleValue

const options = {
    title: 'Add Image',
    takePhotoButtonTitle: 'Take photo',
    chooseFromLibraryButtonTitle: 'Choose image',
}

class Dashboard extends Component {

    constructor(props) {
        super(props)
        firebase.database.database().ref('User').on('child_added', function (snapshot) {
            userDataValue = snapshot.val()
            currentUser = firebase.firebase.auth().currentUser.email
            if (currentUser === userDataValue.email) {
                profileImage = userDataValue.userProfile
            }
        })
        const { navigation } = props
        updatedProfile = navigation.getParam('updatedProfile', require('../Assets/ProfileIcon.jpg'))
        this.state = {
            googleKeepImageVisibility: false,
            profileVisibility: false,
            userEmail: '',
            avtarSource: null,
            usersNote: [],
            countClick: 0,
            gridDisplay: false,
            gridView: {
                display: 'none'
            },
            icon: grid,
            toggleSearchBar: {
                display: 'none'
            },
            searchBarDisp: {
                display: styles.searchBar
            },
        }
        console.disableYellowBox = true
    }

    updateSearch = () => {
        this.props.navigation.navigate('SearchNote')
    }

    takeNote = () => {
        this.props.navigation.navigate('CreateNote')
    }

    profileDisplay = () => {
        var userDataa = firebase.firebase.auth().currentUser
        var userEmailId = userDataa.email
        this.props.navigation.navigate('SignOutMenu', { userEmailId })
    }

    galleryIcon = () => {
        ImagePicker.showImagePicker(options, (response) => {
            console.log("Response : " + response);
            if (response.didCancel) {
                console.log('User cancelled Image Picker');
            } else if (response.error) {
                console.log("Image Picker Error : " + response.error);
            } else {
                let source = { uri: response.uri }
                this.setState({
                    avtarSource: source
                })
            }
        })
    }

    componentDidMount() {
        UserData.userData(response => {
            if (response !== null) {
                this.setState({
                    usersNote: response
                })
            }
        })

        // await firebase.database.database().ref('User').on('child_added', function (snapshot) {
        //     userDataValue = snapshot.val()
        //     currentUser = firebase.firebase.auth().currentUser.email
        //     console.log('Current user in update ' + userDataValue.email);
        //     if (currentUser === userDataValue.email) {
        //         profileImage = userDataValue.userProfile
        //     }
        // })

        setInterval(() => this.showReminder(), 60000)
        console.log('Profile Image in Component Did Update ' + profileImage);
        this.checkPermission();
        this.createNotificationListeners();
    }

    componentWillUnmount() {
        this.notificationListener();
        this.notificationOpenedListener();
    }

    async checkPermission() {
        const enabled = await firebaseNotify.messaging().hasPermission();
        if (enabled) {
            this.getToken();
        } else {
            this.requestPermission();
        }
    }

    async requestPermission() {
        try {
            await firebaseNotify.messaging().requestPermission();
            this.getToken();        // User has authorised
        } catch (error) {
            console.log('permission rejected');     // User has rejected permissions
        }
    }

    async getToken() {
        let fcmToken = await AsyncStorage.getItem('fcmToken');
        if (!fcmToken) {
            fcmToken = await firebaseNotify.messaging().getToken();
            console.log('Fcm Token in If ', fcmToken);

            if (fcmToken) {
                console.log('Fcm Token in Else ', fcmToken);  // user has a device token
                await AsyncStorage.setItem('fcmToken', fcmToken);
            }
        }
    }

    async createNotificationListeners() {
        this.notificationListener = firebaseNotify.notifications().onNotification((notification) => {
            const { title, body } = notification;
            this.showAlert(title, body);
        });
        this.notificationOpenedListener = firebaseNotify.notifications().onNotificationOpened((notificationOpen) => {
            const { title, body } = notificationOpen.notification;
            this.showAlert(title, body);
        });
        const notificationOpen = await firebaseNotify.notifications().getInitialNotification();
        if (notificationOpen) {
            const { title, body } = notificationOpen.notification;
            this.showAlert(title, body);
        }
        this.messageListener = firebaseNotify.messaging().onMessage((message) => {
            console.log(JSON.stringify(message));
        });
    }

    showAlert(title, body) {
        Alert.alert(
            title, body,
            [
                { text: 'OK', onPress: () => console.log('OK Pressed') },
            ],
            { cancelable: false },
        );
    }

    // static getDerivedStateFromProps(props, state){
    //     console.log("Get Derived State From Props");
    // }

    gridDisplay = () => {
        if (!this.state.gridDisplay) {
            this.setState({
                gridDisplay: true,
                icon: list
            })
        } else {
            this.setState({
                gridDisplay: false,
                icon: grid
            })
        }
    }

    showReminder = () => {
        if (reminderValue === currentDate) {
            console.log('Reminder Value ' + reminderValue === currentDate);
            PushNotification.localNotification({
                title: titleValue,
                message: noteValue,
                color: 'red',
                actions: ["Yes", "No"]
            })
        }
    }

    render() {
        return (
            <View style={styles.dashboardContainer}>
                <View style={styles.dashboardSubContainer}>
                    <View style={this.state.toggleSearchBar}>
                        <ToggleSearchBar />
                    </View>

                    {/* <View>
                        <SearchBar navigation = {this.props.navigation} />
                        </View> */}

                    <View>
                        {/* <DefaultSearchBar textdisplay = 'Search your Note' navigation = {this.props.navigation}/> */}
                        <View style={styles.searchBar}>
                            <View>
                                <TouchableOpacity style={{ width: 50 }}
                                    onPress={this.props.navigation.openDrawer}>
                                    <Image style={{ width: 30, height: 30, left: 10, top: 3 }}
                                        source={require('../Assets/DrawerIcon.png')} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ left: 70, top: -23 }}>
                                <TouchableOpacity style={{ width: 120 }}
                                    onPress={this.updateSearch}>
                                    <Text>
                                        Search your Notes
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.profileIcon}>
                                <View style={{ display: "flex", alignItems: "flex-end", right: 60, top: 4 }}>
                                    <TouchableOpacity onPress={this.gridDisplay}>
                                        <Image style={{ width: 30, height: 30 }}
                                            source={this.state.icon} />
                                    </TouchableOpacity>
                                </View>

                                <View style={{ right: 10, top: -26 }}>
                                    <TouchableOpacity onPress={this.profileDisplay}>
                                        <Avatar.Image size={30}
                                            source={updatedProfile === '' ? updatedProfile : profileImage} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>

                    <ScrollView>
                        <View>
                            <Text> PINNED </Text>
                            <View style={styles.userCard}>
                                {
                                    Object.getOwnPropertyNames(this.state.usersNote).map((key, indexing) => {
                                        console.log('Key Object in Dashboard ', this.state.usersNote[key]);
                                        
                                        if (!this.state.usersNote[key].isArchive && !this.state.usersNote[key].Deleted && this.state.usersNote[key].isPin) {
                                            return (
                                                <Note index={indexing} Title={this.state.usersNote[key].Title} Note={this.state.usersNote[key].Note}
                                                    navigation={this.props.navigation} gridDisplayValue={this.state.gridDisplay} noteKey ={key} 
                                                    Color={this.state.usersNote[key].Color} Reminder={this.state.usersNote[key].Reminder} chosenImage={this.state.usersNote[key].chosenImage} />
                                            );
                                        }
                                        if (this.state.usersNote[key].Reminder === currentDate) {
                                            PushNotification.localNotification({
                                                title: this.state.usersNote[key].Title,
                                                message: this.state.usersNote[key].Note,
                                                color: 'red',
                                                actions: ["Yes", "No"]
                                            })
                                        }
                                    })
                                }
                            </View>
                        </View>

                        <View>
                            <Text> OTHERS </Text>
                            <View style={styles.userCard}>
                                {
                                    Object.getOwnPropertyNames(this.state.usersNote).map((key, indexing) => {
                                        if (!this.state.usersNote[key].chosenImage === "") {
                                            return (
                                                <FastImage style={{ width: 'auto', height: 'auto' }}
                                                    source={this.state.usersNote[key].chosenImage}
                                                    resizeMode={FastImage.resizeMode.contain} />
                                            )
                                        }
                                        if (!this.state.usersNote[key].isArchive && !this.state.usersNote[key].Deleted && !this.state.usersNote[key].isPin) {
                                            return (
                                                <Note index={indexing} Title={this.state.usersNote[key].Title} Note={this.state.usersNote[key].Note}
                                                    navigation={this.props.navigation} gridDisplayValue={this.state.gridDisplay} noteKey = {key}
                                                    Color={this.state.usersNote[key].Color} Reminder={this.state.usersNote[key].Reminder} chosenImage={this.state.usersNote[key].chosenImage} />
                                            );
                                        }
                                        if (this.state.usersNote[key].Reminder === currentDate) {
                                            PushNotification.localNotification({
                                                title: this.state.usersNote[key].Title,
                                                message: this.state.usersNote[key].Note,
                                                color: 'red',
                                                actions: ["Yes", "No"]
                                            })
                                        }
                                    })
                                }
                            </View>
                        </View>
                    </ScrollView>

                    {/* <View style = {styles.googleKeepImage}>
                        <Image 
                        style = {{width : 100, height : 100}}
                        source = {require('../Assets/GoogleKeep.png')}
                        />
                        <Text style = {styles.addNotesLabel}> Notes You Add Appear Here </Text>
                    </View> */}
                </View>

                <View style={styles.takeNote}>
                    <View>
                        <TouchableOpacity onPress={this.takeNote}>
                            <Text style={{ fontSize: 19 }}> Take a note... </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.checkBoxImage}>
                        <TouchableOpacity onPress={this.checkBox}>
                            <Image style={{ width: 20, height: 20 }}
                                source={require('../Assets/Checkbox.png')} />
                        </TouchableOpacity>
                    </View>

                    <View>
                        <TouchableOpacity onPress={this.PaintBrush}>
                            <Image style={{ width: 20, height: 20 }}
                                source={require('../Assets/PaintBrush.png')} />
                        </TouchableOpacity>
                    </View>

                    <View>
                        <TouchableOpacity onPress={this.AudioListener}>
                            <Image style={{ width: 20, height: 20 }}
                                source={require('../Assets/AudioListener.png')} />
                        </TouchableOpacity>
                    </View>

                    <View>
                        <TouchableOpacity onPress={this.galleryIcon}>
                            <Image style={{ width: 20, height: 20 }}
                                source={require('../Assets/GalleryIcon.png')} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }
}

export default Dashboard