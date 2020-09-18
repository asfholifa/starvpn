import { createAction } from 'redux-actions';

export default {
  logUsage: createAction('LOG_USAGE'),
  setCurrentUsage: createAction('SET_CURRENT_USAGE'),
};
