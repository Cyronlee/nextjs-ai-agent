refactor @app/chat/layout.tsx and related codes

- keep the app sidebar layout
- keep the page height as 100vh
- route change should not refresh the sidebar state, like all conversations list should be kept

refactor @components/chat/chat-container.tsx and related codes

- the container should not scroll
- the input area should be fixed at the bottom of the page
- the messages area should be scrollable
- clear uploaded files state after send messages
