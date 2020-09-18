import { createAction } from 'redux-actions';

export default {
  login: createAction('USER_LOGIN'),
  logout: createAction('USER_LOGOUT'),
  updateSlot: createAction('USER_UPDATE_SLOT')
};
