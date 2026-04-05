"use client";

import { useState } from "react";
import useAuthStore from "@/store/authStore";

export default function LoginPage() {
    const login = useAuthStore(
        (state) => state.login
    );

    const [form, setForm] = useState({
        serverUrl: "",
        username: "",
        password: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify(form)
            }
        );

        const data = await response.json();

        if (data.success) {
            login(data);
            alert("Login successful");
        } else {
            alert("Login failed");
        }
    };

    return (
        <main className="p-8">
            <h1 className="text-3xl mb-6">
                Login
            </h1>

            <form
                onSubmit={handleSubmit}
                className="space-y-4 max-w-md"
            >
                <input
                    type="text"
                    placeholder="Server URL"
                    className="w-full p-3 bg-zinc-800"
                    onChange={(e) =>
                        setForm({
                            ...form,
                            serverUrl: e.target.value
                        })
                    }
                />

                <input
                    type="text"
                    placeholder="Username"
                    className="w-full p-3 bg-zinc-800"
                    onChange={(e) =>
                        setForm({
                            ...form,
                            username: e.target.value
                        })
                    }
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-3 bg-zinc-800"
                    onChange={(e) =>
                        setForm({
                            ...form,
                            password: e.target.value
                        })
                    }
                />

                <button className="bg-green-600 px-6 py-3 rounded-xl">
                    Login
                </button>
            </form>
        </main>
    );
}