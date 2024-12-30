import React from 'react';
import './CreateRoomModal.css';

interface CreateRoomModalProps {
  formData: {
    roomName: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isLoading: boolean;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  formData,
  onInputChange,
  onSubmit,
  onClose,
  isLoading
}) => {
  return (
    <div className="create-room-modal">
      <div className="modal-content">
        <h2>Create New Chat Room</h2>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Room Name</label>
            <input
              type="text"
              name="roomName"
              placeholder="Enter room name"
              value={formData.roomName}
              onChange={onInputChange}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="create-button" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal; 