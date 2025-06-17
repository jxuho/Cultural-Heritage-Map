import { Menu, MenuItem } from "./ContextMenu";


const MapContextMenu = () => {

  return (
    <Menu>
        <MenuItem onClick={() => console.log('hello')}>
          <div className="px-1 mx-1 text-xs">Suggest this place</div>
        </MenuItem>
    </Menu>
  );
};

export default MapContextMenu;
