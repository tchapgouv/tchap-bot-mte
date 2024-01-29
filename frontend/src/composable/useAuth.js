import {ref} from 'vue'
import fetchWithError from "@/scripts/fetchWithError.js";

const user = ref(null)
const apiPath = import.meta.env.VITE_API_ENDPOINT
const authError = ""

export default () => {

  const useCheckAuth = async () => {
    if (user.value) return true

    fetchWithError(apiPath + '/api/user')
      .then(stream => stream.json())
      .then(data => {
        // if user is returned, it means that the cookie is valid,
        // and we are logged in
        if (data.user) {
          // set the user for later use
          user.value = data.user
          return true
        }
      }).catch(e => console.error(e))

    // if we get here, it means we are not logged in
    user.value = null;
    return false;
  }


  return {
    user,
    authError,
    useCheckAuth
  }
}