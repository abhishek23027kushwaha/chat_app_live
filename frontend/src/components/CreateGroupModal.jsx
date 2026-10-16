import React, { useState, useRef } from "react";
import { RxCross2 } from "react-icons/rx";
import { MdGroups, MdAddPhotoAlternate, MdCheck } from "react-icons/md";
import { IoIosSearch } from "react-icons/io";
import dp from "../assets/dp.webp";
import axios from "axios";
import { server_url } from "@/utils/constant";
import { useDispatch, useSelector } from "react-redux";
import { setGroups, setSelectedGroup } from "@/redux/userSlice";

function CreateGroupModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { otherUsers, groups } = useSelector((store) => store.auth);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef();

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const toggleMember = (userId) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const filteredUsers = (otherUsers || []).filter((user) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(term);
    const userMatch = user.userName?.toLowerCase().includes(term);
    return nameMatch || userMatch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a group name");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("members", JSON.stringify(selectedMemberIds));
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await axios.post(`${server_url}/api/group/create`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update state
      dispatch(setGroups([res.data, ...(groups || [])]));
      dispatch(setSelectedGroup(res.data));

      // Reset & close
      setName("");
      setDescription("");
      setSelectedMemberIds([]);
      setPreviewImage(null);
      setImageFile(null);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1797c2] to-[#20c7ff] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MdGroups className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Create New Group</h2>
              <p className="text-xs text-white/90">Add members and start chatting</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer"
          >
            <RxCross2 className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Group Image & Name row */}
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-[#1797c2] flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-all shadow-inner"
                title="Upload group picture"
              >
                {previewImage ? (
                  <img src={previewImage} alt="Group preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#1797c2]">
                    <MdAddPhotoAlternate className="w-7 h-7" />
                    <span className="text-[10px] font-semibold mt-1">Add DP</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Group Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Project Team, Family, Friends"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1797c2] focus:ring-2 focus:ring-[#1797c2]/20 outline-none text-sm text-gray-800 transition-all"
              />
            </div>
          </div>

          {/* Group Description */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows="2"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-[#1797c2] focus:ring-2 focus:ring-[#1797c2]/20 outline-none text-sm text-gray-800 resize-none transition-all"
            />
          </div>

          {/* Add Members section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-600 uppercase">
                Select Members ({selectedMemberIds.length} selected)
              </label>
              {selectedMemberIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedMemberIds([])}
                  className="text-xs text-[#1797c2] hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Member Search input */}
            <div className="relative mb-2">
              <IoIosSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users to add..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#1797c2]"
              />
            </div>

            {/* Users checklist */}
            <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-2xl divide-y divide-gray-100 bg-gray-50/50 p-1">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isChecked = selectedMemberIds.includes(user._id);
                  return (
                    <div
                      key={user._id}
                      onClick={() => toggleMember(user._id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isChecked ? "bg-white shadow-sm border border-cyan-100" : "hover:bg-gray-100/70"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={user.image || dp}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {user.name || user.userName}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">@{user.userName}</p>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isChecked
                            ? "bg-[#1797c2] text-white"
                            : "border-2 border-gray-300 bg-white"
                        }`}
                      >
                        {isChecked && <MdCheck className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-gray-400">No users found</div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 text-sm font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1797c2] to-[#20c7ff] text-white text-sm font-semibold shadow-md hover:shadow-lg hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default CreateGroupModal;
