import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  homeOutline,
  createOutline,
} from 'ionicons/icons';

import Home from './pages/Home';
import Editor from './pages/Editor';
import FormulaDetail from './pages/FormulaDetail';

const App = () => (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/home" component={Home} />
          <Route exact path="/editor" component={Editor} />
          <Route exact path="/editor/:id" component={Editor} />
          <Route exact path="/formula/:id" component={FormulaDetail} />
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>

        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href="/home">
            <IonIcon icon={homeOutline} />
            <IonLabel>Início</IonLabel>
          </IonTabButton>

          <IonTabButton tab="editor" href="/editor">
            <IonIcon icon={createOutline} />
            <IonLabel>Editor</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
);

export default App;