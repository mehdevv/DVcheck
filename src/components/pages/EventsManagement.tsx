import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { 
  Calendar,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Users,
  X,
  Save,
  Upload,
  QrCode as QrCodeIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Event, CreateEventData, User } from '../../types';
import { eventService } from '../../firebase/eventService';
import { userService } from '../../firebase/userService';
import { QRScanner } from '../QRScanner';
import { Footer } from '../ui/Footer';

export const EventsManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanningForEvent, setScanningForEvent] = useState<Event | null>(null);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newEvent, setNewEvent] = useState<CreateEventData>({
    name: '',
    picture: '',
    description: '',
    members: []
  });

  // Load events and users
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [eventsData, usersData] = await Promise.all([
          eventService.getEvents(),
          userService.getUsers()
        ]);
        setEvents(eventsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (editingEvent) {
        setNewEvent({ ...newEvent, picture: base64String });
      } else {
        setNewEvent({ ...newEvent, picture: base64String });
      }
    };
    reader.onerror = () => {
      alert('Error reading image file');
    };
    reader.readAsDataURL(file);
  };

  // Handle member selection
  const toggleMember = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  // Handle create event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEvent.name.trim()) {
      alert('Please enter an event name');
      return;
    }
    
    if (!newEvent.description.trim()) {
      alert('Please enter an event description');
      return;
    }
    
    if (!newEvent.picture) {
      alert('Please upload an event picture');
      return;
    }

    try {
      setIsLoading(true);
      const eventData: CreateEventData = {
        ...newEvent,
        members: selectedMembers
      };
      
      if (editingEvent) {
        await eventService.updateEvent(editingEvent.id, eventData);
      } else {
        await eventService.createEvent(eventData);
      }
      
      // Refresh events
      const eventsData = await eventService.getEvents();
      setEvents(eventsData);
      
      // Reset form
      setNewEvent({ name: '', picture: '', description: '', members: [] });
      setSelectedMembers([]);
      setShowCreateForm(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      setIsLoading(true);
      await eventService.deleteEvent(eventId);
      const eventsData = await eventService.getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit event
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      name: event.name,
      picture: event.picture,
      description: event.description,
      members: event.members
    });
    setSelectedMembers(event.members);
    setShowCreateForm(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingEvent(null);
    setNewEvent({ name: '', picture: '', description: '', members: [] });
    setSelectedMembers([]);
    setShowCreateForm(false);
  };

  // Get member names by IDs
  const getMemberNames = (memberIds: string[]): string[] => {
    return memberIds
      .map(id => users.find(u => u.id === id)?.name)
      .filter((name): name is string => !!name);
  };

  // Handle QR scan success
  const handleQRScanSuccess = async (scannedData: { name: string; email: string }) => {
    if (!scanningForEvent) return;

    try {
      // Find user by email
      const user = await userService.getUserByEmail(scannedData.email);
      
      if (!user) {
        setScanMessage({ 
          type: 'error', 
          text: `Member not found: ${scannedData.email}` 
        });
        setTimeout(() => setScanMessage(null), 5000);
        return;
      }

      // Check if member is already in the event
      if (scanningForEvent.members.includes(user.id)) {
        setScanMessage({ 
          type: 'error', 
          text: `${user.name} is already added to this event` 
        });
        setTimeout(() => setScanMessage(null), 5000);
        return;
      }

      // Add member to event
      const updatedMembers = [...scanningForEvent.members, user.id];
      await eventService.updateEvent(scanningForEvent.id, { members: updatedMembers });

      // Refresh events
      const eventsData = await eventService.getEvents();
      setEvents(eventsData);

      // Update scanningForEvent to reflect changes
      const updatedEvent = eventsData.find(e => e.id === scanningForEvent.id);
      if (updatedEvent) {
        setScanningForEvent(updatedEvent);
      }

      setScanMessage({ 
        type: 'success', 
        text: `Successfully added ${user.name} to the event!` 
      });
      setTimeout(() => setScanMessage(null), 3000);
    } catch (error: any) {
      console.error('Error adding member from QR scan:', error);
      setScanMessage({ 
        type: 'error', 
        text: `Error: ${error.message || 'Failed to add member'}` 
      });
      setTimeout(() => setScanMessage(null), 5000);
    }
  };

  // Open QR scanner for a specific event
  const handleOpenQRScanner = (event: Event) => {
    setScanningForEvent(event);
    setShowQRScanner(true);
    setScanMessage(null);
  };

  // Close QR scanner
  const handleCloseQRScanner = () => {
    setShowQRScanner(false);
    setScanningForEvent(null);
    setScanMessage(null);
  };

  if (isLoading && events.length === 0) {
    return (
      <div className="min-h-screen bg-notion-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-notion-gray-50 flex flex-col">
      <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-notion-gray-900">Events Management</h1>
            <p className="text-sm text-notion-gray-600">{events.length} event(s) total</p>
          </div>
          <Button
            onClick={() => {
              setEditingEvent(null);
              setNewEvent({ name: '', picture: '', description: '', members: [] });
              setSelectedMembers([]);
              setShowCreateForm(true);
            }}
            className="flex items-center space-x-2"
            disabled={showCreateForm}
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </Button>
        </motion.div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-notion-gray-900">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                <Button variant="ghost" onClick={handleCancelEdit}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-6">
                <Input
                  label="Event Name"
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  placeholder="Enter event name"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-notion-gray-700 mb-2">
                    Event Picture
                  </label>
                  <div className="space-y-4">
                    {newEvent.picture && (
                      <div className="relative w-full h-64 rounded-lg overflow-hidden border border-notion-gray-300">
                        <img
                          src={newEvent.picture}
                          alt="Event preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setNewEvent({ ...newEvent, picture: '' })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-notion-gray-300 rounded-lg cursor-pointer hover:border-notion-blue-500 transition-colors">
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="w-8 h-8 text-notion-gray-400" />
                        <span className="text-sm text-notion-gray-600">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-notion-gray-500">
                          PNG, JPG up to 5MB
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-notion-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Enter event description"
                    className="w-full px-3 py-2 border border-notion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue-500 focus:border-notion-blue-500 min-h-[120px] resize-y"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-notion-gray-700 mb-2">
                    Select Members ({selectedMembers.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-notion-gray-300 rounded-lg p-4 space-y-2">
                    {users.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center space-x-3 p-2 hover:bg-notion-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(user.id)}
                          onChange={() => toggleMember(user.id)}
                          className="w-4 h-4 text-notion-blue-600 focus:ring-notion-blue-500 border-notion-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-notion-gray-900">{user.name}</p>
                          <p className="text-xs text-notion-gray-500">{user.email}</p>
                        </div>
                      </label>
                    ))}
                    {users.length === 0 && (
                      <p className="text-sm text-notion-gray-500 text-center py-4">
                        No members available
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancelEdit}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 flex items-center justify-center space-x-2" disabled={isLoading}>
                    <Save className="w-4 h-4" />
                    <span>{editingEvent ? 'Update Event' : 'Create Event'}</span>
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Events Grid */}
        {events.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-notion-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-notion-gray-900 mb-2">No Events Yet</h3>
            <p className="text-notion-gray-600 mb-6">Create your first event to get started</p>
            <Button
              onClick={() => {
                setEditingEvent(null);
                setNewEvent({ name: '', picture: '', description: '', members: [] });
                setSelectedMembers([]);
                setShowCreateForm(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Card hover className="overflow-hidden h-full flex flex-col">
                  {/* Event Image */}
                  <div className="relative w-full h-48 bg-notion-gray-200">
                    {event.picture ? (
                      <img
                        src={event.picture}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-notion-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Event Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-semibold text-notion-gray-900 mb-2">
                      {event.name}
                    </h3>
                    <p className="text-sm text-notion-gray-600 mb-4 flex-1 line-clamp-3">
                      {event.description}
                    </p>

                    {/* Members */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-notion-gray-400" />
                        <span className="text-xs font-medium text-notion-gray-700">
                          {event.members.length} Member(s)
                        </span>
                      </div>
                      {event.members.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {getMemberNames(event.members).slice(0, 3).map((name, index) => (
                            <span
                              key={index}
                              className="text-xs bg-notion-gray-100 text-notion-gray-700 px-2 py-1 rounded"
                            >
                              {name}
                            </span>
                          ))}
                          {event.members.length > 3 && (
                            <span className="text-xs text-notion-gray-500 px-2 py-1">
                              +{event.members.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 pt-4 border-t border-notion-gray-200">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenQRScanner(event)}
                        className="w-full flex items-center justify-center space-x-1"
                      >
                        <QrCodeIcon className="w-3 h-3" />
                        <span>Scan QR Code</span>
                      </Button>
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                          className="flex-1 flex items-center justify-center space-x-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="flex items-center justify-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Scan Message Toast */}
        {scanMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              scanMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {scanMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`text-sm font-medium ${
                scanMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {scanMessage.text}
              </p>
            </div>
          </motion.div>
        )}

        {/* QR Scanner Modal */}
        {showQRScanner && scanningForEvent && (
          <QRScanner
            onScanSuccess={handleQRScanSuccess}
            onClose={handleCloseQRScanner}
          />
        )}
      </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

