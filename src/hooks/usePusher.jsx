import { useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { useDispatch } from "react-redux";
import { addNotification } from "../features/notifications/notificationSlice";

const usePusher = () => {
  const dispatch = useDispatch();
  const pusherRef = useRef(null);

  const token = localStorage.getItem("userToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id;

  useEffect(() => {
    // Agar user login nahi hai toh mat chala
    if (!userId || !token) return;

    // Agar pehle se connected hai toh dubara mat bana
    if (pusherRef.current) return;

    console.log("Connecting to Pusher for user:", userId);

    const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
      forceTLS: true, // Production mein true rakho, local mein bhi true chalega
      authEndpoint: "http://127.0.0.1:8000/api/broadcasting/auth",
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          // "X-User-ID" HATA DIYA — AB ZAROORAT NAHI!
        },
      },
    });

    pusherRef.current = pusher;

    // Private channel subscribe
    const channel = pusher.subscribe("notifications");

    // Event bind — exact same name jo backend mein hai
    channel.bind("new-notification", (data) => {
      console.log("New notification received:", data);
      dispatch(addNotification(data));
    });

    // Success message
    channel.bind("pusher:subscription_succeeded", () => {
      console.log(`Pusher connected! Subscribed to private-user.${userId}`);
    });

    // Error handling
    channel.bind("pusher:subscription_error", (error) => {
      console.error("Pusher subscription failed:", error);
    });

    // Cleanup on unmount
    return () => {
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(`private-user.${userId}`);
        pusherRef.current.disconnect();
        pusherRef.current = null;
        console.log("Pusher disconnected");
      }
    };
  }, [userId, token, dispatch]);

  return null; // Hook kuch return nahi karta
};

export default usePusher;