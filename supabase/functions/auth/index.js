"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var server_ts_1 = require("https://deno.land/std@0.168.0/http/server.ts");
var supabase_js_2_1 = require("https://esm.sh/@supabase/supabase-js@2");
var corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
(0, server_ts_1.serve)(function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var url, path, supabaseUrl, supabaseKey, supabase, _a, email, password, username, _b, data, error, playerError, _c, data, error, error_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                // Handle CORS preflight requests
                if (req.method === 'OPTIONS') {
                    return [2 /*return*/, new Response('ok', { headers: corsHeaders })];
                }
                _d.label = 1;
            case 1:
                _d.trys.push([1, 10, , 11]);
                url = new URL(req.url);
                path = url.pathname.split('/').pop();
                supabaseUrl = 'https://sfeckdcnlczdtvwpdxer.supabase.co';
                supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZWNrZGNubGN6ZHR2d3BkeGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgxNTM2NiwiZXhwIjoyMDY3MzkxMzY2fQ.a5SnwwzoQJnoZu1eYTEPX4vB7va4YYLGBYoKGJGQZRw';
                supabase = (0, supabase_js_2_1.createClient)(supabaseUrl, supabaseKey, {
                    db: {
                        schema: 'public',
                    },
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false,
                    },
                });
                return [4 /*yield*/, req.json()];
            case 2:
                _a = _d.sent(), email = _a.email, password = _a.password, username = _a.username;
                if (!(path === 'signup')) return [3 /*break*/, 6];
                // Sign up with email, password, and username
                if (!email || !password || !username) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Email, password, and username are required' }), { status: 400, headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }) })];
                }
                console.log('Edge function: Creating user with username:', username);
                return [4 /*yield*/, supabase.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            emailRedirectTo: 'http://localhost:3000',
                            data: {
                                display_name: username
                            }
                        }
                    })];
            case 3:
                _b = _d.sent(), data = _b.data, error = _b.error;
                if (error) {
                    console.error('Edge function: Error signing up:', error);
                    return [2 /*return*/, new Response(JSON.stringify({ error: error }), { status: 400, headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }) })];
                }
                if (!data.user) return [3 /*break*/, 5];
                return [4 /*yield*/, supabase
                        .from('spieler')
                        .insert({
                        name: username,
                        email: email,
                        user_id: data.user.id
                    })];
            case 4:
                playerError = (_d.sent()).error;
                if (playerError) {
                    console.error('Edge function: Error creating player profile:', playerError);
                }
                _d.label = 5;
            case 5: return [2 /*return*/, new Response(JSON.stringify({ user: data.user }), { status: 200, headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }) })];
            case 6:
                if (!(path === 'signin')) return [3 /*break*/, 8];
                // Sign in with email and password
                if (!email || !password) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400, headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }) })];
                }
                console.log('Edge function: Signing in user:', email);
                return [4 /*yield*/, supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    })];
            case 7:
                _c = _d.sent(), data = _c.data, error = _c.error;
                if (error) {
                    console.error('Edge function: Error signing in:', error);
                    return [2 /*return*/, new Response(JSON.stringify({ error: error }), { status: 400, headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }) })];
                }
                return [2 /*return*/, new Response(JSON.stringify({ session: data.session, user: data.user }), { status: 200, headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }) })];
            case 8: return [2 /*return*/, new Response(JSON.stringify({ error: 'Invalid endpoint' }), { status: 404, headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }) })];
            case 9: return [3 /*break*/, 11];
            case 10:
                error_1 = _d.sent();
                console.error('Edge function: Unexpected error:', error_1);
                return [2 /*return*/, new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }) })];
            case 11: return [2 /*return*/];
        }
    });
}); });
