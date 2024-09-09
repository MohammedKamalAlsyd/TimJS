import React from 'react';
import { Icon, Box, Flex, Link, textDecoration } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import '../styles/Sidebar.css';

function SidebarItem({ icon, title, active }) {
  return (
    <Link width={'100%'} as={RouterLink} to={`/${title.toLowerCase().replace(/\s/g, '-')}`} _hover={{textDecoration:'none'}}>
        <Box height={'60px'} display={'flex'} alignItems={'center'}>
            <Flex flexDir="row" gap="15px" >
                <Icon marginLeft={"40px"}
                    as={icon}
                    className='slidebar-icon'
                    fontSize={'20px'}
                />
                <h2 height={'20px'} style={{fontWeight:active ? '500' : 'inherit'}}>
                    {title}
                </h2>
            </Flex>
        </Box>
    </Link>

  );
}

export default SidebarItem;
