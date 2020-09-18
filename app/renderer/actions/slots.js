import { createAction } from 'redux-actions';

export default {
  selectCurrent: createAction('SLOT_SELECT_CURRENT'),
  saveSlot: createAction('SLOT_SAVE_CURRENT'),
  setAvailableData: createAction('SLOT_SET_AVAILABLE_DATA'),
  setNewType: createAction('SLOT_SET_NEW_IP_TYPE'),
  setNewCountry: createAction('SLOT_SET_NEW_COUNTRY'),
  setNewRegion: createAction('SLOT_SET_NEW_REGION'),
  setNewIntervalIsp: createAction('SLOT_SET_NEW_INTERVAL_OR_ISPS'),
  setSlot: createAction('SLOT_SET_SELECTED_SLOT'),
  setCurrentSlotData: createAction('SLOT_SET_CURRENT_SLOT_DATA'),
  clearSlotsData: createAction('SLOT_CLEAR_SLOTS_DATA'),
  resetCurrentSlotChanges: createAction('SLOT_RESET_CURRENT_CHANGES'),
  updateSlotName: createAction('SLOT_UPDATE_SLOT_NAME'),
};
