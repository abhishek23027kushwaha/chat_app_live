import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name:"auth",
    initialState:{
        loading:false,
        userData:null,
        profileData:null,
        otherUsers: [],
        selectedUser: null,
        messages: []
    },
    reducers:{
        // actions
        setLoading:(state, action) => {
            state.loading = action.payload;
        },
        setUserData:(state, action) => {
            state.userData = action.payload;
        },
        setProfileData:(state, action) => {
            state.profileData = action.payload;
        },
        setOtherUsers:(state, action) => {
            state.otherUsers = action.payload;
        },
        setSelectedUser:(state, action) => {
            state.selectedUser = action.payload;
        },
        setMessages:(state, action) => {
            state.messages = action.payload;
        }
    }
});
export const {setLoading, setUserData,setProfileData, setOtherUsers, setSelectedUser, setMessages} = authSlice.actions;
export default authSlice.reducer;