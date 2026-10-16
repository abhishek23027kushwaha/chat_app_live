import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name:"auth",
    initialState:{
        loading:false,
        userData:null,
        profileData:null,
        otherUsers: [],
        selectedUser: null,
        groups: [],
        selectedGroup: null,
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
            if (action.payload) {
                state.selectedGroup = null;
            }
        },
        setGroups:(state, action) => {
            state.groups = action.payload;
        },
        setSelectedGroup:(state, action) => {
            state.selectedGroup = action.payload;
            if (action.payload) {
                state.selectedUser = null;
            }
        },
        updateGroupInList:(state, action) => {
            const updated = action.payload;
            state.groups = (state.groups || []).map((g) =>
                String(g._id) === String(updated._id) ? updated : g
            );
            if (state.selectedGroup && String(state.selectedGroup._id) === String(updated._id)) {
                state.selectedGroup = updated;
            }
        },
        removeGroupFromList:(state, action) => {
            const groupId = action.payload;
            state.groups = (state.groups || []).filter(
                (g) => String(g._id) !== String(groupId)
            );
            if (state.selectedGroup && String(state.selectedGroup._id) === String(groupId)) {
                state.selectedGroup = null;
            }
        },
        setMessages:(state, action) => {
            state.messages = action.payload;
        }
    }
});
export const {
    setLoading,
    setUserData,
    setProfileData,
    setOtherUsers,
    setSelectedUser,
    setGroups,
    setSelectedGroup,
    updateGroupInList,
    removeGroupFromList,
    setMessages
} = authSlice.actions;
export default authSlice.reducer;